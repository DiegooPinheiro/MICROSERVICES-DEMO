const express = require('express'); // Express framework
const morgan = require('morgan'); // HTTP request logger middleware
const { createProxyMiddleware } = require('http-proxy-middleware'); // Proxy middleware
const http = require('http');

const app = express();

// Sanitize incoming request URLs to remove invisible/unicode joiner characters
// that some HTTP clients (or copy/paste) can append, e.g. U+2060 (%E2%81%A0).
// This prevents routes like `/api/users%E2%81%A0` from bypassing proxies.
app.use((req, res, next) => {
  try {
    const invisibleChars = /[\u200B-\u200F\u2028-\u202F\u2060\uFEFF]/g;
    const pctEncodedInvisible = /(%E2%80%8B|%E2%80%8C|%E2%80%8D|%E2%81%A0|%EF%BB%BF)/gi;
    const original = req.url || '';
    // First remove percent-encoded invisible sequences (e.g. %E2%81%A0)
    let cleaned = original.replace(pctEncodedInvisible, '');
    // Then remove actual unicode invisible characters if present
    cleaned = cleaned.replace(invisibleChars, '');
    if (cleaned !== original) {
      console.info(`Sanitized request URL: "${original}" -> "${cleaned}"`);
      req.url = cleaned;
      if (req.originalUrl) req.originalUrl = cleaned;
    }
  } catch (err) {
    console.warn('URL sanitizer error:', err && err.message);
  }
  next();
});

// Middleware
// Gateway Routes with Proxy Middleware
// (mounted before body parsing so the original request stream is proxied unchanged)
// If client sends 'Expect: 100-continue', respond immediately so the client will send the body.
app.use((req, res, next) => {
  try {
    const expect = req.headers['expect'];
    if (expect && String(expect).toLowerCase() === '100-continue') {
      if (res.writeContinue) {
        res.writeContinue();
        console.info('Sent 100-continue to client');
      }
    }
  } catch (e) {
    // swallow
  }
  // strip Expect header to avoid clients waiting on 100-continue semantics
  try {
    if (req.headers && req.headers.expect) delete req.headers.expect;
  } catch (e) {}
  next();
});
// NOTE: we intentionally do NOT parse request bodies for /api/* routes here.
// Proxies must see the original request stream so we forward bodies reliably.
// However, some clients send chunked or inconsistent bodies. We capture the raw
// body bytes for `/api` routes and forward the exact bytes to the target to
// ensure services receive the same payload.
app.use(
  '/api',
  express.raw({
    type: ['application/json', 'application/*+json'],
    limit: '2mb',
    verify: (req, res, buf) => {
      if (buf && buf.length) req.rawBody = Buffer.from(buf);
    },
  })
);

// Log incoming requests after sanitization and before body parsing effects
app.use((req, res, next) => {
  try {
    console.info(`Incoming request: ${req.method} ${req.url} headers: ${JSON.stringify(req.headers)}`);
  } catch (e) {
    console.info('Incoming request (logging failed)');
  }
  next();
});

// Permissive fallback route: if client sent no body but provided name/email
// as query params, perform a direct POST to the users-service and pipe response.
app.post('/api/users', (req, res, next) => {
  try {
    const method = (req.method || '').toUpperCase();
    if (['POST','PUT','PATCH'].includes(method) && (!req.rawBody || req.rawBody.length === 0) && req.query && req.query.name && req.query.email) {
      const payload = JSON.stringify({ name: req.query.name, email: req.query.email });
      const opts = {
        hostname: 'users-service',
        port: 3001,
        path: '/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };
      const prox = http.request(opts, (upr) => {
        res.statusCode = upr.statusCode;
        upr.pipe(res);
      });
      prox.on('error', (err) => {
        console.error('Direct forward error:', err && err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Bad Gateway', message: err && err.message });
      });
      prox.write(payload);
      prox.end();
      return;
    }
  } catch (e) {
    // continue to proxy
  }
  next();
});

// Quick validation: if client claims JSON but no body was sent, return a clearer 400.
app.use('/api', (req, res, next) => {
  try {
    const hasBodyMethod = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    const contentLength = req.headers['content-length'];
    const transferEncoding = req.headers['transfer-encoding'];
    if (hasBodyMethod && contentType.includes('application/json')) {
      // If we parsed and captured rawBody, accept. Otherwise if content-length explicitly 0
      // and there's no transfer-encoding, reject with a helpful message — unless
      // query params contain name/email (we allow that as a permissive fallback).
      const hasQueryBody = req.query && req.query.name && req.query.email;
      if ((!req.rawBody || req.rawBody.length === 0) && (contentLength === '0' || (!contentLength && !transferEncoding)) && !hasQueryBody) {
        return res.status(400).json({ error: 'Request body missing. Ensure your client sends a JSON body (raw JSON) and sets Content-Type: application/json.' });
      }
    }
  } catch (e) {
    // swallow, continue to proxy
  }
  next();
});

// Gateway Routes with Proxy Middleware
// Users Service - routes to port 3001
app.use(
  '/api/users',
  createProxyMiddleware({
    target: 'http://users-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/': '/users',
    },
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
      console.info(`Proxying to target (users): ${proxyReq.path} ${proxyReq.getHeader('host') || ''}`);
      try {
        // Forward essential headers only
        if (req.headers && req.headers['content-type'] && !proxyReq.getHeader('content-type')) {
          proxyReq.setHeader('content-type', req.headers['content-type']);
        }
        if (req.headers && req.headers['content-length'] && !proxyReq.getHeader('content-length')) {
          proxyReq.setHeader('content-length', req.headers['content-length']);
        }
      } catch (e) {
        // ignore
      }
      // If we captured the raw body, forward it exactly and end the proxied request.
      if (req.rawBody && req.rawBody.length) {
        try {
          if (!proxyReq.getHeader('content-type') && req.headers['content-type']) {
            proxyReq.setHeader('content-type', req.headers['content-type']);
          }
          proxyReq.setHeader('content-length', Buffer.byteLength(req.rawBody));
          proxyReq.write(req.rawBody);
          proxyReq.end();
        } catch (e) {
          console.warn('Failed forwarding rawBody (users):', e && e.message);
        }
      }
      // Fallback: if no rawBody but query params contain name/email, build a JSON body
      if ((!req.rawBody || req.rawBody.length === 0) && ['POST','PUT','PATCH'].includes((req.method||'').toUpperCase())) {
        try {
          const maybe = {};
          if (req.query && req.query.name) maybe.name = req.query.name;
          if (req.query && req.query.email) maybe.email = req.query.email;
          if (Object.keys(maybe).length) {
            const buf = Buffer.from(JSON.stringify(maybe));
            if (!proxyReq.getHeader('content-type')) proxyReq.setHeader('content-type', 'application/json');
            proxyReq.setHeader('content-length', Buffer.byteLength(buf));
            proxyReq.write(buf);
            proxyReq.end();
            return;
          }
        } catch (e) {
          // ignore
        }
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      try {
        console.info(`Proxy response from users target: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
      } catch (e) {
        console.info('Proxy response received (users)');
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error (users):', err && err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Bad Gateway', message: err && err.message });
    },
  })
);

// Products Service - routes to port 3002
app.use(
  '/api/products',
  createProxyMiddleware({
    target: 'http://products-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/': '/products',
    },
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
      console.info(`Proxying to target (products): ${proxyReq.path} ${proxyReq.getHeader('host') || ''}`);
      try {
        if (req.headers && req.headers['content-type'] && !proxyReq.getHeader('content-type')) {
          proxyReq.setHeader('content-type', req.headers['content-type']);
        }
        if (req.headers && req.headers['content-length'] && !proxyReq.getHeader('content-length')) {
          proxyReq.setHeader('content-length', req.headers['content-length']);
        }
      } catch (e) {
        // ignore
      }
      if (req.rawBody && req.rawBody.length) {
        try {
          if (!proxyReq.getHeader('content-type') && req.headers['content-type']) {
            proxyReq.setHeader('content-type', req.headers['content-type']);
          }
          proxyReq.setHeader('content-length', Buffer.byteLength(req.rawBody));
          proxyReq.write(req.rawBody);
          proxyReq.end();
        } catch (e) {
          console.warn('Failed forwarding rawBody (products):', e && e.message);
        }
      }
      if ((!req.rawBody || req.rawBody.length === 0) && ['POST','PUT','PATCH'].includes((req.method||'').toUpperCase())) {
        try {
          const maybe = {};
          if (req.query && req.query.name) maybe.name = req.query.name;
          if (req.query && req.query.email) maybe.email = req.query.email;
          if (Object.keys(maybe).length) {
            const buf = Buffer.from(JSON.stringify(maybe));
            if (!proxyReq.getHeader('content-type')) proxyReq.setHeader('content-type', 'application/json');
            proxyReq.setHeader('content-length', Buffer.byteLength(buf));
            proxyReq.write(buf);
            proxyReq.end();
            return;
          }
        } catch (e) {}
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      try {
        console.info(`Proxy response from products target: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
      } catch (e) {
        console.info('Proxy response received (products)');
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error (products):', err && err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Bad Gateway', message: err && err.message });
    },
  })
);



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway is running',
    routes: {
      users: '/api/users',
      products: '/api/products',
      health: '/health',
    },
  });
});

// Debug endpoint to inspect how gateway receives the request
// parse JSON only for debug route so we can inspect body safely
app.use('/debug/req-info', express.json({ limit: '2mb' }));
app.all('/debug/req-info', (req, res) => {
  res.json({
    url: req.url,
    originalUrl: req.originalUrl,
    method: req.method,
    headers: req.headers,
    bodyReceived: req.body || null,
  });
});

// API raw debug: returns the raw bytes received for /api requests (useful for
// testing clients that may send empty bodies). Sends JSON when possible.
app.post('/api/debug/raw', (req, res) => {
  try {
    if (req.rawBody && req.rawBody.length) {
      const asText = req.rawBody.toString('utf8');
      try {
        const parsed = JSON.parse(asText);
        return res.json({ raw: parsed });
      } catch (e) {
        return res.json({ rawBase64: req.rawBody.toString('base64'), rawText: asText });
      }
    }
    return res.status(400).json({ error: 'No raw body received' });
  } catch (e) {
    return res.status(500).json({ error: 'Debug error', message: e.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
  console.log(`Users Service: http://localhost:${PORT}/api/users`);
  console.log(`Products Service: http://localhost:${PORT}/api/products`);
});
