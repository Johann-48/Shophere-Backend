// src/controllers/avaliacaoProduto.controller.js
const model = require("../models/avaliacaoProduto.model");

exports.createReview = async (req, res) => {
  console.log("REQ.BODY", req.body);
  console.log("REQ.PARAMS", req.params);
  console.log("REQ.USER", req.userId);
  console.log("▶ createReview chamado:", {
    params: req.params,
    body: req.body,
    userId: req.userId,
  });
  try {
    const usuarioId = req.userId;
    const produtoId = parseInt(req.params.id, 10);

    const jaAvaliou = await model.findByUserAndProduct(usuarioId, produtoId);
    if (jaAvaliou) {
      return res.status(400).json({ error: "Você já avaliou este produto." });
    }

    const { conteudo, nota } = req.body;

    // Validação mínima
    if (
      typeof nota !== "number" ||
      nota < 1 ||
      nota > 5 ||
      typeof conteudo !== "string" ||
      conteudo.trim().length === 0
    ) {
      return res.status(400).json({ error: "Conteúdo e nota inválidos." });
    }

    // Chamada ao model
    const insertId = await model.create({
      usuarioId,
      produtoId,
      conteudo,
      nota,
    });
    console.log("✅ insertId:", insertId);

    return res.status(201).json({ message: "Avaliação criada.", id: insertId });
  } catch (err) {
    console.error("❌ Erro em createReview:", err);
    return res
      .status(500)
      .json({ error: "Erro ao criar avaliação.", detail: err.message });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const produtoId = parseInt(req.params.id, 10);
    const reviews = await model.findByProduct(produtoId);
    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar avaliações." });
  }
};
