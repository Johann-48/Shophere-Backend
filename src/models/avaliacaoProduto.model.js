const pool = require("../config/db");

const AvaliacaoProdutoModel = {
  async create({ usuarioId, produtoId, conteudo, nota }) {
    const sql = `
      INSERT INTO avaliacoesproduto
        (usuario_id, produto_id, conteudo, nota)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      usuarioId,
      produtoId,
      conteudo,
      nota,
    ]);
    return result.insertId;
  },

  async findByProduct(produtoId) {
    const sql = `
      SELECT 
        a.id,
        a.usuario_id,
        a.produto_id,
        a.conteudo,
        a.nota,
        u.nome AS usuario
      FROM avaliacoesproduto a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.produto_id = ?
      ORDER BY a.id DESC
    `;
    const [rows] = await pool.query(sql, [produtoId]);
    return rows;
  },

  async findByUserAndProduct(usuarioId, produtoId) {
    const [rows] = await pool.query(
      "SELECT id FROM avaliacoesproduto WHERE usuario_id = ? AND produto_id = ?",
      [usuarioId, produtoId]
    );
    return rows[0] || null;
  },
};

module.exports = AvaliacaoProdutoModel;
