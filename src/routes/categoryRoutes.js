const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET /api/categories → retorna todas as categorias do banco
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nome FROM categorias");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

module.exports = router;
