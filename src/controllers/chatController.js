// GET /api/chats?clienteId=...&lojaId=...
// controllers/chatController.js
const pool = require("../config/db");

// GET /api/chats?clienteId=...&lojaId=...&message=...
exports.getOrCreateChat = async (req, res) => {
  const { clienteId, lojaId, initMessage } = req.query;
  let chatId;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Busca chat existente
    const [[existing]] = await conn.query(
      `SELECT id FROM chats WHERE cliente_id = ? AND loja_id = ?`,
      [clienteId, lojaId]
    );

    if (existing) {
      chatId = existing.id;
    } else {
      // 2) Cria novo chat
      // 2) Cria novo chat ou recupera existente de forma atômica
      const [insertRes] = await conn.query(
        `INSERT INTO chats (cliente_id, loja_id, criado_em)
   VALUES (?, ?, NOW())
   ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
        [clienteId, lojaId]
      );
      // insertRes.insertId agora será o id do chat novo ou o existente
      chatId = insertRes.insertId;
    }

    // 3) Se veio mensagem inicial (initMessage), insere como primeira mensagem
    if (initMessage) {
      await conn.query(
        `INSERT INTO mensagens
         (chat_id, remetente, tipo, conteudo, criado_em)
       VALUES (?, 'cliente', 'texto', ?, NOW())`,
        [chatId, decodeURIComponent(initMessage)]
      );
    }

    await conn.commit();

    // 4) Busca e retorna o chat
    const [[chat]] = await pool.query(`SELECT * FROM chats WHERE id = ?`, [
      chatId,
    ]);
    // se quiser, pode também retornar a lista de mensagens já com a inicial
    res.status(existing ? 200 : 201).json(chat);
  } catch (err) {
    await conn.rollback();
    console.error("Erro ao obter/criar chat:", err);
    res.status(500).json({ error: "Erro interno ao obter/criar chat" });
  } finally {
    conn.release();
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
