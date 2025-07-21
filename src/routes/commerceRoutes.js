// src/routes/commerceRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/commerceController");
const { requireAuth, requireCommerce } = require("../middleware/auth");

router.get("/me", requireAuth, requireCommerce, controller.getMyCommerce);
router.put("/me", requireAuth, requireCommerce, controller.updateCommerce);

// Rotas públicas:
router.post("/signup", controller.signupCommerce);
router.get("/search", controller.searchCommerces);
router.get("/", controller.getAllCommerces);
router.get("/:id", controller.getCommerceById);
router.get("/lojas", controller.listCommerces);

module.exports = router;
