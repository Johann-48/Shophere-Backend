// src/routes/commerceRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/commerceController");

// POST /api/commerces/signup → cria novo comércio
router.post("/signup", controller.signupCommerce);

// GET /api/commerces/search → busca por nome
router.get("/search", controller.searchCommerces);

// GET /api/commerces → lista todos os comércios
router.get("/", controller.getAllCommerces);

// GET /api/commerces/:id → detalhes de 1 comércio (inclui address)
router.get("/:id", controller.getCommerceById);

module.exports = router;
