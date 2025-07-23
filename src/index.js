// src/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const commerceRoutes = require("./routes/commerceRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const avaliacoesRouter = require("./routes/avaliacaoProduto.routes");
const commerceController = require("./controllers/commerceController");

const app = express();

// 1) Middlewares globais
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// 2) Garante que as pastas uploads e uploads/audios existam
const uploadsDir = path.join(__dirname, "uploads");
const audiosDir = path.join(uploadsDir, "audios");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(audiosDir)) {
  fs.mkdirSync(audiosDir, { recursive: true });
}

// 3) Servir uploads como caminho estático (apenas uma vez!)
app.use("/uploads", express.static(uploadsDir));

// 4) Rotas principais
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/commerces", commerceRoutes);
app.get("/api/lojas", commerceController.listCommerces);
app.use("/api/avaliacoes", avaliacoesRouter);
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/chats/:chatId/mensagens", require("./routes/mensagemRoutes"));
app.use("/api/upload", uploadRoutes); // Inclui upload de áudio
// src/index.js — logo abaixo de app.use("/api/upload", uploadRoutes);
app.use("/api/upload/image", require("./routes/imageUploadRoutes"));

// 5) Upload de imagem de produto
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/api/upload/:produtoId", upload.single("foto"), async (req, res) => {
  try {
    const pool = require("./config/db");
    const { produtoId } = req.params;
    const filePath = `/uploads/${req.file.filename}`;

    await pool.query(
      "INSERT INTO fotos_produto (produto_id, url, principal) VALUES (?, ?, 1)",
      [produtoId, filePath]
    );

    return res.json({ message: "Imagem enviada com sucesso", url: filePath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao salvar no banco" });
  }
});

// 6) Teste básico
app.get("/", (req, res) => {
  res.json({ message: "Backend funcionando" });
});

// 7) Catch‑all de rota não encontrada
app.use((req, res) => {
  console.log("Rota não encontrada:", req.method, req.url);
  res.status(404).json({ error: "Rota não encontrada" });
});

// 8) Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);
});
