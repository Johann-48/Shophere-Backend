// src/middleware/auth.js
const jwt = require("jsonwebtoken");

exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato do token inválido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Verifica se veio o role
    if (!payload.role) {
      return res.status(401).json({ error: "Role não presente no token" });
    }
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

exports.requireCommerce = (req, res, next) => {
  // assume que requireAuth já foi executado
  if (req.userRole !== "commerce") {
    return res
      .status(403)
      .json({ error: "Acesso permitido somente a comércios" });
  }
  next();
};
