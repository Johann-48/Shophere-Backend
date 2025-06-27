const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ✅ Rota para produtos por categoria - mais específica
router.get("/categoria/:categoriaId", productController.getByCategoria);

// ✅ Lista de produtos - opcional
router.get("/", productController.listProducts);

// ✅ Rota para obter produto por ID - mais genérica
router.get("/:id", productController.getProductById);

module.exports = router;
