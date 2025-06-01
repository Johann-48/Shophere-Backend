// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

// Futuramente poderemos adicionar registro, logout, etc.
// router.post('/register', authController.register);

module.exports = router;
