const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes"); // ← adicione aqui
const commerceRoutes = require("./src/routes/commerceRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
console.log("🔍 productRoutes:", productRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes); // ← e monte aqui
app.use("/api/commerces", commerceRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando" });
});

app.use("/uploads", express.static("uploads"));

// catch-all 404 deve vir **depois** de todas as rotas
app.use((req, res) => {
  console.log("Rota não encontrada:", req.method, req.url);
  res.status(404).json({ error: "Rota não encontrada" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});
