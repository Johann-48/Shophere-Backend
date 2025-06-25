// src/routes/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Rota para obter produto por ID
router.get("/produto/:id", productController.getProductById);

// (Opcional) rota para lista de produtos
router.get("/", productController.listProducts);

module.exports = router;
