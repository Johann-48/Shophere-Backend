const pool = require("../config/db");

// GET /api/chats?clienteId=...&lojaId=...
exports.getOrCreateChat = async (req, res) => {
  const { clienteId, lojaId } = req.query;
  try {
    // 1) Tenta buscar
    const [[chat]] = await pool.query(
      `SELECT * FROM chats WHERE cliente_id = ? AND loja_id = ?`,
      [clienteId, lojaId]
    );
    if (chat) return res.json(chat);

    // 2) Se não existir, cria
    const [result] = await pool.query(
      `INSERT INTO chats (cliente_id, loja_id) VALUES (?, ?)`,
      [clienteId, lojaId]
    );
    const [newChat] = await pool.query(`SELECT * FROM chats WHERE id = ?`, [
      result.insertId,
    ]);
    res.status(201).json(newChat[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno ao obter/criar chat" });
  }
};

exports.listChats = async (req, res) => {
  const { lojaId } = req.query;
  if (!lojaId) {
    return res.status(400).json({ error: "Falta query param lojaId" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
         ch.cliente_id,
         MAX(ch.criado_em) AS ultimo_contato,
         u.nome AS cliente_nome,
         u.foto_perfil
       FROM chats ch
       JOIN usuarios u ON u.id = ch.cliente_id
       WHERE ch.loja_id = ?
       GROUP BY ch.cliente_id
       ORDER BY ultimo_contato DESC`,
      [lojaId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar chats:", err);
    return res.status(500).json({ error: "Erro interno ao listar chats." });
  }
};
