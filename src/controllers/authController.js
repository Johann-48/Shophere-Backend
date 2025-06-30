// src/controllers/authController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Função auxiliar: buscar usuário por email
async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
    email,
  ]);
  return rows.length > 0 ? rows[0] : null;
}

// Função auxiliar: buscar comércio por email
async function findCommerceByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM comercios WHERE email = ?", [
    email,
  ]);
  return rows.length > 0 ? { ...rows[0], isCommerce: true } : null;
}

// Função para fazer login
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios." });
    }

    // ↓↓↓ INÍCIO DO PATCH ↓↓↓
    let entity = await findUserByEmail(email);
    let role = "user";

    if (!entity) {
      entity = await findCommerceByEmail(email);
      role = entity ? "commerce" : role;
    }

    if (!entity) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }
    // ↑↑↑ FIM DO PATCH ↑↑↑

    // ↓↓↓ USAR entity.senha ↓↓↓
    let senhaValida = false;
    if (entity.senha.startsWith("$2b$") || entity.senha.startsWith("$2a$")) {
      senhaValida = await bcrypt.compare(senha, entity.senha);
    } else {
      senhaValida = senha === entity.senha;
    }
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }
    // ↑↑↑ FIM da verificação de senha ↑↑↑

    // Gera token com role...
    const payload = {
      id: entity.id,
      email: entity.email,
      nome: entity.nome,
      role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    return res.json({
      message: "Autenticação realizada com sucesso.",
      token,
      user: { id: entity.id, email: entity.email, nome: entity.nome, role },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

exports.getUserProfile = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone FROM usuarios WHERE id = ?",
      [decoded.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(rows[0]);
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
};

exports.signup = async (req, res) => {
  try {
    const { nome, email, senha, endereco, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Todos os campos obrigatórios." });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha, endereco, telefone) VALUES (?, ?, ?, ?, ?)",
      [nome, email, hashedPassword, endereco || null, telefone || null]
    );

    return res.status(201).json({ message: "Usuário criado com sucesso." });
  } catch (error) {
    console.error("Erro no signup:", error);
    return res.status(500).json({ message: "Erro interno ao criar conta." });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // preenchido pelo middleware
    const { nome, email, telefone } = req.body;

    // Atualiza no banco
    await pool.query(
      "UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?",
      [nome, email, telefone, userId]
    );

    // Retorna o usuário atualizado
    const [rows] = await pool.query(
      "SELECT id, nome, email, telefone FROM usuarios WHERE id = ?",
      [userId]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    return res.status(500).json({ error: "Erro interno ao salvar perfil" });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.userId;
    const imageUrl = `/uploads/${req.file.filename}`;
    await pool.query("UPDATE usuarios SET foto = ? WHERE id = ?", [
      imageUrl,
      userId,
    ]);
    res.json({ imageUrl });
  } catch (err) {
    console.error("Erro no upload de imagem:", err);
    res.status(500).json({ error: "Erro ao salvar imagem" });
  }
};
