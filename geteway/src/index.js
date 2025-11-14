const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Middleware
app.use(morgan('combined'));
app.use(express.json());

// Gateway Routes with Proxy Middleware
// Users Service - routes to port 3001
app.use(
  '/api/users',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '/users',
    },
    logLevel: 'info',
  })
);

// Products Service - routes to port 3002
app.use(
  '/api/products',
  createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/products': '/products',
    },
    logLevel: 'info',
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
