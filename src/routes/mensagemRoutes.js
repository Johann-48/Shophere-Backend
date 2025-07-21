const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  listMensagens,
  createMensagem,
} = require("../controllers/mensagemController");

router.get("/", listMensagens);
router.post("/", createMensagem);

module.exports = router;
