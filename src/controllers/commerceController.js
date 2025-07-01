// src/controllers/commerceController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Buscar comércio por email
async function findCommerceByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM comercios WHERE email = ?", [
    email,
  ]);
  return rows[0] || null;
}

// Criar novo comércio
exports.signupCommerce = async (req, res) => {
  try {
    const { nome, email, senha, endereco, telefone } = req.body;
    if (!nome || !email || !senha) {
      return res
        .status(400)
        .json({ message: "nome, email e senha são obrigatórios." });
    }

    const existing = await findCommerceByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email já cadastrado para outro comércio." });
    }

    const hashed = await bcrypt.hash(senha, 10);
    await pool.query(
      `INSERT INTO comercios
         (nome, email, senha, endereco, telefone)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, email, hashed, endereco || null, telefone || null]
    );

    return res.status(201).json({ message: "Comércio criado com sucesso." });
  } catch (err) {
    console.error("signupCommerce error:", err);
    return res.status(500).json({ message: "Erro interno ao criar comércio." });
  }
};

// Listar todos os comércios (opcional)
exports.getAllCommerces = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         nome          AS name,
         descricao     AS description,
         fotos      AS logoUrl
       FROM comercios
       ORDER BY nome`
    );
    res.json({ commerces: rows });
  } catch (err) {
    console.error("Erro ao listar comércios:", err);
    res.status(500).json({ error: "Erro ao listar comércios" });
  }
};

exports.getCommerceById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         nome          AS name,
         descricao     AS description,
         fotos      AS logoUrl
       FROM comercios
       WHERE id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Comércio não encontrado." });
    }
    res.json({ commerce: rows[0] });
  } catch (err) {
    console.error("Erro ao buscar comércio:", err);
    res.status(500).json({ error: "Erro ao buscar comércio" });
  }
};

exports.searchCommerces = async (req, res) => {
  const q = req.query.q || "";
  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         nome AS name,
         fotos AS logoUrl
       FROM comercios
       WHERE nome LIKE ?
       ORDER BY nome`,
      [`%${q}%`]
    );
    res.json({ commerces: rows });
  } catch (err) {
    console.error("Erro ao buscar comércios:", err);
    res.status(500).json({ error: "Erro ao buscar comércios" });
  }
};
