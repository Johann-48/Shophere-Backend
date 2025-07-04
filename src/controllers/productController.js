const pool = require("../config/db");

// ✅ GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscar produto + dados do comércio
    const [rows] = await pool.query(
      `SELECT 
         p.id,
         p.marca,
         p.nome            AS produto_nome,
         p.preco,
         p.fotos,
         p.codigo_barras   AS barcode,        -- já selecionado
         p.quantidade,
         p.comercio_id,
         c.nome            AS comercio_nome,
         c.telefone        AS comercio_telefone,
         c.endereco        AS comercio_endereco
       FROM produtos p
       JOIN comercios c ON p.comercio_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    const prod = rows[0];

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
    if (typeof prod.fotos === "string" && prod.fotos.trim() !== "") {
      try {
        const parsed = JSON.parse(prod.fotos);
        thumbnails = Array.isArray(parsed) ? parsed : [];
      } catch {
        thumbnails = prod.fotos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    const mainImage =
      thumbnails.length > 0
        ? thumbnails[0]
        : "https://via.placeholder.com/400x400?text=Sem+Imagem";

    // 4. Monta resposta
    const produtoResponse = {
      id: prod.id,
      title: prod.produto_nome,
      price: `R$ ${parseFloat(prod.preco).toFixed(2)}`,
      marca: prod.marca,
      mainImage,
      thumbnails,
      description: `Produto da marca ${prod.marca}`,
      stock: prod.quantidade > 0,
      quantidade: prod.quantidade,
      categorias: catRows.map((c) => c.nome),

      // ◾ Aqui adicionamos o código de barras:
      barcode: prod.barcode,

      // ◾ Dados do comércio
      comercio: {
        id: prod.comercio_id,
        nome: prod.comercio_nome,
        telefone: prod.comercio_telefone,
        endereco: prod.comercio_endereco,
      },
    };

    return res.json(produtoResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ✅ GET /api/products
exports.listProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.nome AS title,
        p.preco AS price,
        p.fotos AS fotos,
        p.codigo_barras AS barcode,
        p.marca,
        c.nome AS comercioNome
      FROM produtos p
      JOIN comercios c ON c.id = p.comercio_id
    `);

    const produtos = rows.map((prod) => {
      let thumbnails = [];

      if (prod.fotos) {
        try {
          thumbnails = JSON.parse(prod.fotos);
        } catch {
          thumbnails = prod.fotos
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      const mainImage =
        thumbnails.length > 0
          ? thumbnails[0]
          : "https://via.placeholder.com/400x400?text=Sem+Imagem";

      return {
        id: prod.id,
        title: prod.title,
        price: `R$ ${parseFloat(prod.price).toFixed(2)}`,
        mainImage,
        thumbnails,
        barcode: prod.barcode,
        marca: prod.marca,
        comercio: {
          nome: prod.comercioNome,
        },
      };
    });

    res.json(produtos);
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
};

exports.getProductsByCategory = async (req, res) => {
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

exports.searchProducts = async (req, res) => {
  const q = req.query.q || "";
  try {
    const sql = `
      SELECT 
        p.id,
        p.nome      AS name,
        p.preco     AS price,
        p.descricao AS description,
        p.fotos AS mainImage,
        c.nome      AS comercioNome
      FROM produtos p
      LEFT JOIN comercios c ON p.comercio_id = c.id
      WHERE p.nome LIKE ?
      LIMIT 50
    `;
    const [rows] = await pool.query(sql, [`%${q}%`]);
    res.json({ products: rows });
  } catch (err) {
    console.error("Erro na busca:", err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

exports.getProductsByCommerce = async (req, res) => {
  const { id } = req.params; // id do comércio
  try {
    const [rows] = await pool.query(
      `SELECT 
         p.id,
         p.nome        AS name,
         p.preco       AS price,
         p.descricao   AS description,
         p.fotos       AS mainImage,    /* se for JSON, ou p.fotos se for string */
         c.nome        AS comercioNome
       FROM produtos p
       LEFT JOIN comercios c ON p.comercio_id = c.id
       WHERE p.comercio_id = ?`,
      [id]
    );
    res.json({ products: rows });
  } catch (err) {
    console.error("Erro ao buscar produtos por comércio:", err);
    res.status(500).json({ error: "Erro ao buscar produtos do comércio" });
  }
};

// Buscar produtos por código de barras (para comparação)
exports.getProductsByBarcode = async (req, res) => {
  const { codigo } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
         p.id,
         p.nome AS name,
         p.preco AS price,
         p.descricao AS description,
         p.fotos AS mainImage,
         p.codigo_barras AS barcode,
         c.nome AS comercioNome,
         c.id AS comercioId
       FROM produtos p
       LEFT JOIN comercios c ON p.comercio_id = c.id
       WHERE p.codigo_barras = ?`,
      [codigo]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar produtos por código de barras:", err);
    res.status(500).json({ message: "Erro interno ao buscar produtos." });
  }
};
