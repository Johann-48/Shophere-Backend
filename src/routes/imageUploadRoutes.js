// routes/imageUploadRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const imagensDir = path.join(__dirname, "../uploads/imagens");
if (!fs.existsSync(imagensDir)) fs.mkdirSync(imagensDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagensDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `img_${Date.now()}${ext}`;
    cb(null, nome);
  },
});

const upload = multer({ storage });

router.post("/imagem", upload.single("imagem"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });
  // retorna caminho público
  return res.json({ caminho: `/uploads/imagens/${req.file.filename}` });
});

module.exports = router;
