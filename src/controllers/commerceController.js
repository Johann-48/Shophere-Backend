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
  const [rows] = await pool.query(
    "SELECT id, nome, email, endereco, telefone, fotos FROM comercios"
  );
  res.json(rows);
};

// Obter detalhes de um comércio por ID
exports.getCommerceById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    "SELECT id, nome, email, endereco, telefone, fotos FROM comercios WHERE id = ?",
    [id]
  );
  if (!rows.length)
    return res.status(404).json({ message: "Comércio não encontrado." });
  res.json(rows[0]);
};
