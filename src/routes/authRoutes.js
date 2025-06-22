// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const multer = require("multer");
const path = require("path");

// POST /api/auth/login
router.post("/login", authController.login);
router.get("/me", authController.getUserProfile);

// Futuramente poderemos adicionar registro, logout, etc.
// router.post('/register', authController.register);

// Configuração do multer para salvar imagens no disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // pasta de destino
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + ext;
    cb(null, uniqueName); // nome único
  },
});

const upload = multer({ storage });

// Upload de imagem de perfil
router.post("/upload-profile", upload.single("foto"), async (req, res) => {
  const { id } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;

  // Atualizar o campo da imagem no banco (supondo coluna `foto`)
  try {
    await pool.query("UPDATE usuarios SET foto = ? WHERE id = ?", [
      imageUrl,
      id,
    ]);
    res.json({ message: "Imagem salva com sucesso", imageUrl });
  } catch (err) {
    res.status(500).json({ error: "Erro ao salvar imagem" });
  }
});

module.exports = router;
