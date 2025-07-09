const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { requireAuth, requireCommerce } = require("../middleware/auth");

router.post("/", requireAuth, requireCommerce, productController.createProduct);
router.get("/search", productController.searchProducts);
router.get("/categoria/:categoriaId", productController.getProductsByCategory);
router.get("/commerce/:id", productController.getProductsByCommerce);
router.get("/barcode/:codigo", productController.getProductsByBarcode);
router.get("/:id", productController.getProductById);

// ✅ ESSA LINHA é a que faltava:
router.get("/", productController.listProducts);

module.exports = router;
