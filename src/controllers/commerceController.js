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

// Listar todos os comércios
exports.getAllCommerces = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         nome AS name,
         descricao AS description,
         fotos AS logoUrl,
         endereco AS address
       FROM comercios
       ORDER BY nome`
    );
    res.json({ commerces: rows });
  } catch (err) {
    console.error("Erro ao listar comércios:", err);
    res.status(500).json({ error: "Erro ao listar comércios" });
  }
};

// Detalhes de 1 comércio
exports.getCommerceById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         nome AS name,
         descricao AS description,
         fotos AS logoUrl,
         endereco AS address
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

// Busca por nome (opcional)
exports.searchCommerces = async (req, res) => {
  const q = req.query.q || "";
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         nome AS name,
         fotos AS logoUrl,
         endereco AS address
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

// GET /api/commerces/me
exports.getMyCommerce = async (req, res) => {
  const comercioId = req.userId;
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         nome,
         descricao,
         fotos      AS logoUrl,
         endereco
       FROM comercios
       WHERE id = ?`,
      [comercioId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Loja não encontrada." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar dados da loja:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// PUT /api/commerces/me
exports.updateCommerce = async (req, res) => {
  const comercioId = req.userId;
  const { nome, endereco, logoUrl, descricao } = req.body;
  try {
    await pool.query(
      `UPDATE comercios
         SET nome = ?, endereco = ?, fotos = ?, descricao = ?
       WHERE id = ?`,
      [nome, endereco, logoUrl, descricao, comercioId]
    );
    // opcional: retornar dados atualizados
    res.json({ message: "Loja atualizada com sucesso." });
  } catch (err) {
    console.error("Erro ao atualizar loja:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// **ao final de** src/controllers/commerceController.js

// retorna [{ id, nome, imagem }] para o front‑end listar as lojas
exports.listCommerces = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, fotos AS imagem FROM comercios ORDER BY nome"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar lojas:", err);
    res.status(500).json({ error: "Erro interno ao listar lojas." });
  }
};
