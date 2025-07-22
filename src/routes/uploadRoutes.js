const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// 1) Monta o caminho absoluto da pasta de áudio
const audiosDir = path.join(__dirname, "../uploads/audios");
// 2) Garante que a pasta exista
if (!fs.existsSync(audiosDir)) {
  fs.mkdirSync(audiosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audiosDir);
  },
  filename: (req, file, cb) => {
    const nome = `audio_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, nome);
  },
});

const upload = multer({ storage });

router.post("/audio", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  // Retorna a URL pública correta
  const caminho = `/uploads/audios/${req.file.filename}`;
  res.json({ caminho });
});

module.exports = router;
