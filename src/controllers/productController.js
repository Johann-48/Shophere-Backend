// src/controllers/productController.js
const pool = require("../config/db");

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    // Ajuste o SELECT conforme suas colunas reais.
    // Aqui supondo colunas: id, marca, nome, preco, fotos (JSON text ou CSV), codigo_barras.
    const [rows] = await pool.query(
      "SELECT id, marca, nome, preco, fotos, codigo_barras FROM produtos WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    const prod = rows[0];

    // Parse da coluna `fotos`. Dependendo de como você armazenar:
    //  - Se for JSON string no campo `fotos`, use JSON.parse.
    //  - Se for CSV (URL1,URL2,...), use split.
    let thumbnails = [];
    let mainImage = "";

    if (prod.fotos) {
      try {
        // tente JSON.parse; se falhar, trate como CSV:
        const arr = JSON.parse(prod.fotos);
        if (Array.isArray(arr) && arr.length > 0) {
          thumbnails = arr;
        } else {
          thumbnails = [];
        }
      } catch (e) {
        // fallback CSV
        thumbnails = prod.fotos
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }
    }
    if (thumbnails.length > 0) {
      mainImage = thumbnails[0];
    } else {
      // placeholder se não houver imagens ainda
      mainImage = "https://via.placeholder.com/400x400?text=Sem+Imagem";
    }

    // Monte o objeto no formato que o frontend espera:
    const produtoResponse = {
      id: prod.id,
      title: prod.nome,
      price: `R$ ${parseFloat(prod.preco).toFixed(2)}`, // formate conforme necessário
      // oldPrice: null, // ou se tiver coluna de preço antigo
      marca: prod.marca,
      codigo_barras: prod.codigo_barras,
      mainImage,
      thumbnails,
      // Você não tem descrição/estoque/estrelas na tabela atual; se quiser, pode adicionar colunas ou usar valores padrão:
      description: prod.marca
        ? `Produto da marca ${prod.marca}`
        : `Descrição não disponível`,
      stock: true, // ou false conforme lógica sua; se não tiver coluna de estoque, mantenha true
      stars: 0, // sem dado real, ou defina padrão
    };

    return res.json(produtoResponse);
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// (Opcional) GET /api/products para lista de produtos
exports.listProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, marca, nome, preco, fotos, codigo_barras FROM produtos"
    );
    const list = rows.map((prod) => {
      let thumbnails = [];
      try {
        const arr = JSON.parse(prod.fotos);
        if (Array.isArray(arr)) thumbnails = arr;
      } catch {
        thumbnails = prod.fotos
          ? prod.fotos
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [];
      }
      const mainImage =
        thumbnails.length > 0
          ? thumbnails[0]
          : "https://via.placeholder.com/400x400?text=Sem+Imagem";
      return {
        id: prod.id,
        title: prod.nome,
        price: `R$ ${parseFloat(prod.preco).toFixed(2)}`,
        mainImage,
        thumbnails,
        stock: true,
        stars: 0,
      };
    });
    return res.json(list);
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

exports.getByCategoria = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT p.id, p.marca, p.nome, p.preco, p.fotos, p.codigo_barras
      FROM produtos p
      JOIN produtos_categorias pc ON pc.produto_id = p.id
      WHERE pc.categoria_id = ?
      `,
      [categoriaId]
    );

    const produtos = rows.map((prod) => {
      let thumbnails = [];
      if (prod.fotos) {
        try {
          thumbnails = JSON.parse(prod.fotos);
        } catch {
          thumbnails = prod.fotos
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        }
      }

      const mainImage =
        thumbnails.length > 0
          ? thumbnails[0]
          : "https://via.placeholder.com/400x400?text=Sem+Imagem";

      return {
        id: prod.id,
        title: prod.nome,
        price: `R$ ${parseFloat(prod.preco).toFixed(2)}`,
        mainImage,
        thumbnails,
        marca: prod.marca,
        codigo_barras: prod.codigo_barras,
        description: prod.marca
          ? `Produto da marca ${prod.marca}`
          : "Descrição não disponível",
        stock: true,
        stars: 0,
      };
    });

    return res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos por categoria:", error);
    return res
      .status(500)
      .json({ error: "Erro ao buscar produtos por categoria" });
  }
};
