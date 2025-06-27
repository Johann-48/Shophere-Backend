const express = require("express");
const router = express.Router(); // ← ESTA é a Router do Express
const productController = require("../controllers/productController");

// Defina as rotas sobre esse router:
router.get("/categoria/:categoriaId", productController.getByCategoria);
router.get("/", productController.listProducts);
router.get("/:id", productController.getProductById);

module.exports = router;
