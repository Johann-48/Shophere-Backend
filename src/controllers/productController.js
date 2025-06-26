const pool = require("../config/db");

// ✅ GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Buscar o produto
    const [produtoRows] = await pool.query(
      "SELECT id, marca, nome, preco, fotos, codigo_barras, quantidade FROM produtos WHERE id = ?",
      [id]
    );
    if (produtoRows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const prod = produtoRows[0];

    // 2. Buscar categorias associadas
    const [catRows] = await pool.query(
      `SELECT c.id, c.nome 
       FROM categorias c
       JOIN produtos_categorias pc ON pc.categoria_id = c.id
       WHERE pc.produto_id = ?`,
      [id]
    );

    // 3. Processar imagens
    let thumbnails = [];
    let mainImage = "";
    try {
      thumbnails = JSON.parse(prod.fotos);
    } catch (e) {
      thumbnails = prod.fotos ? prod.fotos.split(",").map((s) => s.trim()) : [];
    }
    if (thumbnails.length > 0) {
      mainImage = thumbnails[0];
    } else {
      mainImage = "https://via.placeholder.com/400x400?text=Sem+Imagem";
    }

    const produtoResponse = {
      id: prod.id,
      title: prod.nome,
      price: `R$ ${parseFloat(prod.preco).toFixed(2)}`,
      marca: prod.marca,
      codigo_barras: prod.codigo_barras,
      mainImage,
      thumbnails,
      description: prod.marca
        ? `Produto da marca ${prod.marca}`
        : `Descrição não disponível`,
      stock: prod.quantidade > 0,
      stars: 0,
      quantidade: prod.quantidade,
      categorias: catRows.map((cat) => cat.nome),
    };

    return res.json(produtoResponse);
  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ✅ GET /api/products
exports.listProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, marca, nome, preco, fotos, codigo_barras, quantidade FROM produtos"
    );

    const list = rows.map((prod) => {
      let thumbnails = [];

      try {
        if (prod.fotos) {
          const parsed = JSON.parse(prod.fotos);
          if (Array.isArray(parsed)) {
            thumbnails = parsed;
          }
        }
      } catch {
        if (typeof prod.fotos === "string") {
          thumbnails = prod.fotos
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      // Protege contra null e não-array
      if (!Array.isArray(thumbnails)) thumbnails = [];

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
        stock: prod.quantidade > 0,
        stars: 0,
        quantidade: prod.quantidade,
      };
    });

    return res.json(list);
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ✅ GET /api/products/categoria/:categoriaId
exports.getByCategoria = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.nome, p.preco, p.fotos, p.quantidade
       FROM produtos p
       JOIN produtos_categorias pc ON pc.produto_id = p.id
       WHERE pc.categoria_id = ?`,
      [categoriaId]
    );

    const list = rows.map((prod) => {
      let thumbnails = [];
      try {
        thumbnails = JSON.parse(prod.fotos);
      } catch {
        thumbnails = prod.fotos
          ? prod.fotos
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      }
      return {
        id: prod.id,
        title: prod.nome,
        price: `R$ ${parseFloat(prod.preco).toFixed(2)}`,
        mainImage:
          thumbnails[0] ||
          "https://via.placeholder.com/400x400?text=Sem+Imagem",
        thumbnails,
        stock: prod.quantidade > 0,
        stars: 0,
        quantidade: prod.quantidade,
      };
    });

    return res.json(list);
  } catch (err) {
    console.error("Erro ao buscar produtos por categoria:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};
