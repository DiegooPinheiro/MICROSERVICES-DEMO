const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Middleware obrigatório para permitir JSON normal
app.use(express.json());
app.use(cors());

// -----------------------------
// Users Service (porta 3001)
// -----------------------------
app.use(
  '/api/users',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/users' },
    onError: (err, req, res) => {
      res.status(500).json({ error: 'Users Service unreachable', details: err.message });
    },
  })
);

// -----------------------------
// Products Service (porta 3002)
// -----------------------------
app.use(
  '/api/products',
  createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/products' },
    onError: (err, req, res) => {
      res.status(500).json({ error: 'Products Service unreachable', details: err.message });
    },
  })
);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway OK', timestamp: new Date() });
});

// Root
app.get('/', (req, res) => {
  res.json({
    status: 'Gateway Online',
    routes: {
      users: '/api/users',
      products: '/api/products',
      health: '/health',
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
