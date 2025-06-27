const pool = require("../config/db");

exports.listCategories = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nome FROM categorias");
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar categorias:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao listar categorias." });
  }
};
