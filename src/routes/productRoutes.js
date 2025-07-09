const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { requireAuth, requireCommerce } = require("../middleware/auth");

// Criar um produto
router.post("/", requireAuth, requireCommerce, productController.createProduct);

// Buscar produtos do comércio logado
router.get(
  "/meus",
  requireAuth,
  requireCommerce,
  productController.getMyProducts
);

// Buscar por busca livre, categoria, comércio ou código de barras
router.get("/search", productController.searchProducts);
router.get("/categoria/:categoriaId", productController.getProductsByCategory);
router.get("/commerce/:id", productController.getProductsByCommerce);
router.get("/barcode/:codigo", productController.getProductsByBarcode);

// Listagem geral (todos os produtos)
router.get("/", productController.listProducts);

// Buscar um produto por ID
router.get("/:id", productController.getProductById);

// Atualizar um produto (somente se for do comércio logado)
router.put(
  "/:id",
  requireAuth,
  requireCommerce,
  productController.updateProduct
);

// Excluir um produto (somente se for do comércio logado)
router.delete(
  "/:id",
  requireAuth,
  requireCommerce,
  productController.deleteProduct
);

module.exports = router;
