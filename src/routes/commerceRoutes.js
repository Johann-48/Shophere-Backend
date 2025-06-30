// src/routes/commerceRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/commerceController");

// POST /api/commerces/signup → cria novo comércio
router.post("/signup", controller.signupCommerce);

// GET  /api/commerces       → lista todos (opcional)
router.get("/", controller.getAllCommerces);

// GET  /api/commerces/:id   → detalhes de 1 comércio
router.get("/:id", controller.getCommerceById);

module.exports = router;
