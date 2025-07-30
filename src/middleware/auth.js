// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // ← importe seu pool

exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato do token inválido" });
  }

  try {
    // 1) Verifica a assinatura e expiração do JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.role) {
      return res.status(401).json({ error: "Role não presente no token" });
    }

    // 2) Checa na tabela `sessions` se esta sessão/token é válida
    const isCommerce = payload.role === "commerce";
    const table = isCommerce ? "sessions_comercios" : "sessions";
    const idField = isCommerce ? "comercio_id" : "user_id";

    // consulta dinâmica
    const [rows] = await pool.query(
      `SELECT 1
     FROM \`${table}\`
    WHERE \`${idField}\` = ?
      AND token = ?
      AND expires_at > NOW()
    LIMIT 1`,
      [payload.id, token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
    if (rows.length === 0) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    // 3) Se tudo OK, anexa os dados ao req
    req.userId = payload.id;
    req.userRole = payload.role;
    req.token = token;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

exports.requireCommerce = (req, res, next) => {
  if (req.userRole !== "commerce") {
    return res
      .status(403)
      .json({ error: "Acesso permitido somente a comércios" });
  }
  next();
};
