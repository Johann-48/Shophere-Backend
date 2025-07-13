// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { signupCommerce } = require("../controllers/commerceController");

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/signup
router.post("/signup", authController.signup);

router.post("/signup-commerce", signupCommerce);
router.put("/change-password", requireAuth, authController.changePassword);

// GET /api/auth/me — retorna perfil (precisa de token)
router.get("/me", requireAuth, authController.getMyProfile);
router.put("/me", requireAuth, authController.updateMyProfile);

module.exports = router;
