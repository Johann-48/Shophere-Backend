// src/routes/avaliacaoProduto.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/avaliacaoProduto.controller");
const { requireAuth } = require("../middleware/auth");

// GET all reviews for a product
router.get("/:id", controller.getReviewsByProduct);

// POST a new review for a product (autenticado)
router.post(
  "/:id",
  requireAuth, // valida token e preenche req.user
  controller.createReview
);

module.exports = router;
