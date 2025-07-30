// src/routes/commerceRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/commerceController");
const { requireAuth, requireCommerce } = require("../middleware/auth");

// rotas privadas...
router.get("/me", requireAuth, requireCommerce, controller.getMyCommerce);
router.put("/me", requireAuth, requireCommerce, controller.updateCommerce);

// rotas públicas que não conflitam:
router.post("/signup", controller.signupCommerce);
router.get("/search", controller.searchCommerces);

// **coloque logo aqui** a rota de listagem geral de lojas:
router.get("/lojas", controller.listCommerces);

// depois, a rota raiz e a rota dinâmica:
router.get("/", controller.getAllCommerces);
router.get("/:id", controller.getCommerceById);

module.exports = router;
