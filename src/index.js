// src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors({ 
  origin: 'http://localhost:5173', // ou o endereço do seu front-end React
  credentials: true 
}));
app.use(express.json()); // para entender JSON no corpo das requisições

// Rotas
app.use('/api/auth', authRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'Backend Shophere rodando!' });
});

// Inicializar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
