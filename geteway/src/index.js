import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// -----------------------------
// USERS SERVICE
// -----------------------------
app.use(
  "/api/users",
  createProxyMiddleware({
    target: "http://localhost:3001", // users-service
    changeOrigin: true,
    pathRewrite: { "^/api/users": "/users" },
  })
);

// -----------------------------
// PRODUCTS SERVICE
// -----------------------------
app.use(
  "/api/products",
  createProxyMiddleware({
    target: "http://localhost:3002", // products-service
    changeOrigin: true,
    pathRewrite: { "^/api/products": "/products" },
  })
);

// Rota de status do gateway
app.get("/", (req, res) => {
  res.send("API Gateway is running");
});

// Porta do gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
