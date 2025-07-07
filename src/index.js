const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const commerceRoutes = require("./routes/commerceRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// 1) Middlewares globais
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// 2) Servir uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3) Rotas
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/commerces", commerceRoutes);
app.use("/api/upload", uploadRoutes); // ← padronizado

// 4) Teste básico
app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando" });
});

// 5) Catch-all de rota não encontrada
app.use((req, res) => {
  console.log("Rota não encontrada:", req.method, req.url);
  res.status(404).json({ error: "Rota não encontrada" });
});

// 6) Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});
