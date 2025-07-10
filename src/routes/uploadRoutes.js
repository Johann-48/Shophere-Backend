// const express = require("express");
// const router = express.Router();
// const upload = require("../middleware/upload");
// const pool = require("../config/db");

// // Agora a rota é "/api/upload/:produtoId"
// router.post("/:produtoId", upload.single("foto"), async (req, res) => {
//   const { produtoId } = req.params;
//   const filePath = `/uploads/${req.file.filename}`;

//   try {
//     await pool.query(
//       "INSERT INTO fotos_produto (produto_id, url, principal) VALUES (?, ?, 1)",
//       [produtoId, filePath]
//     );
//     res.json({ message: "Imagem enviada com sucesso", url: filePath });
//   } catch (err) {
//     res.status(500).json({ error: "Erro ao salvar no banco" });
//   }
// });

// module.exports = router;
