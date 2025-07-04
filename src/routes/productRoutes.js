const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/search", productController.searchProducts);
router.get("/categoria/:categoriaId", productController.getProductsByCategory);
router.get("/commerce/:id", productController.getProductsByCommerce);
router.get("/barcode/:codigo", productController.getProductsByBarcode);
router.get("/", productController.listProducts);
router.get("/:id", productController.getProductById);

module.exports = router;
