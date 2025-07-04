// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/signup
router.post("/signup", authController.signup);

// GET /api/auth/me — retorna perfil (precisa de token)
router.get("/me", authMiddleware, authController.getUserProfile);

// PUT /api/auth/me — atualiza perfil (precisa de token)
router.put("/me", authMiddleware, authController.updateUserProfile);

module.exports = router;
