// src/middleware/auth.js
const jwt = require("jsonwebtoken");
exports.requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Token não fornecido" });
  const [, token] = auth.split(" ");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role; // <— armazena o papel do usuário
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

exports.requireCommerce = (req, res, next) => {
  // já rodou requireAuth antes, então req.userRole existe
  if (req.userRole !== "commerce") {
    return res
      .status(403)
      .json({ error: "Acesso permitido somente a comércios" });
  }
  next();
};
