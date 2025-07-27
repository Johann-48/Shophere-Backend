const express = require("express");
const pool = require("../config/db");
const router = express.Router();
const { getOrCreateChat, listChats } = require("../controllers/chatController");

router.get("/", (req, res, next) => {
  const { clienteId, lojaId, message } = req.query;

  if (clienteId && lojaId) {
    // passa message junto
    req.query.initMessage = message;
    return getOrCreateChat(req, res, next);
  }
  if (lojaId) return listChats(req, res, next);
  return res.status(400).json({ error: "Faltam params clienteId ou lojaId" });
});

router.get("/user/:clienteId", async (req, res) => {
  const { clienteId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
     ch.id,
     ch.loja_id,
     c.nome AS loja_nome,
     c.fotos AS loja_foto,
     ch.criado_em
   FROM chats ch
   JOIN comercios c ON c.id = ch.loja_id
   WHERE ch.cliente_id = ?
   ORDER BY ch.criado_em DESC`,
      [clienteId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar chats por cliente:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

module.exports = router;
