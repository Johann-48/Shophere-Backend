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
         p.codigo_barras   AS barcode,
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
    if (rows.length === 0)
      return res.status(404).json({ error: "Produto não encontrado" });
    const prod = rows[0];

    // 2. Buscar categorias
    const [catRows] = await pool.query(
      `SELECT c.id, c.nome 
       FROM categorias c
       JOIN produtos_categorias pc ON pc.categoria_id = c.id
       WHERE pc.produto_id = ?`,
      [id]
    );

    // 3. Buscar todas as fotos daquele produto
    const [fotoRows] = await pool.query(
      `SELECT url, principal 
       FROM fotos_produto 
       WHERE produto_id = ? 
       ORDER BY principal DESC, id ASC`,
      [id]
    );
    const thumbnails = fotoRows.map((f) => f.url);
    const mainImage =
      (fotoRows.find((f) => f.principal) || {}).url ||
      thumbnails[0] ||
      "https://via.placeholder.com/400x400?text=Sem+Imagem";

    // 3. Buscar todas as avaliações já com nome de usuário
    const [avRows] = await pool.query(
      `SELECT 
      a.id,
      a.conteudo      AS content,
      a.nota          AS note,
      u.nome          AS user
    FROM avaliacoesproduto a
    JOIN usuarios u ON u.id = a.usuario_id
    WHERE a.produto_id = ?
    ORDER BY a.id DESC
  `,
      [id]
    );

    // calcular média e quantidade
    const reviewsCount = avRows.length;
    const avgRating =
      reviewsCount > 0
        ? avRows.reduce((sum, r) => sum + r.note, 0) / reviewsCount
        : 0;

    // agora já temos o array de reviews pronto:
    const reviews = avRows.map((r) => ({
      user: r.user,
      note: r.note,
      content: r.content,
    }));

    // 4. Montar e enviar resposta
    return res.json({
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
      barcode: prod.barcode,
      comercio: {
        id: prod.comercio_id,
        nome: prod.comercio_nome,
        telefone: prod.comercio_telefone,
        endereco: prod.comercio_endereco,
      },

      stars: Math.round(avgRating), // para renderStars()
      reviewsCount,
      reviews,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// ✅ GET /api/products
exports.listProducts = async (req, res) => {
  try {
    // 1. Puxar todos os produtos + nome do comércio + média e contagem de avaliações
    const [produtos] = await pool.query(`
      SELECT 
        p.id,
        p.nome            AS title,
        p.preco           AS price,
        p.marca,
        p.codigo_barras   AS barcode,
        c.nome            AS comercioNome,
        COALESCE(AVG(a.nota), 0)  AS avgRating,
        COALESCE(COUNT(a.id), 0)  AS reviewsCount
      FROM produtos p
      JOIN comercios c ON c.id = p.comercio_id
      LEFT JOIN avaliacoesproduto a ON a.produto_id = p.id
      GROUP BY p.id, p.nome, p.preco, p.marca, p.codigo_barras, c.nome
    `);

    if (produtos.length === 0) return res.json([]);

    // 2. Buscar todas as fotos de uma vez
    const ids = produtos.map((p) => p.id);
    const [fotos] = await pool.query(
      `SELECT produto_id, url, principal
       FROM fotos_produto
       WHERE produto_id IN (?)
       ORDER BY principal DESC, id ASC`,
      [ids]
    );

    // 3. Montar array final, incluindo stars e reviewsCount
    const result = produtos.map((prod) => {
      const avg = parseFloat(prod.avgRating); // converte a string em número
      const fotosDoProduto = fotos
        .filter((f) => f.produto_id === prod.id)
        .map((f) => f.url);

      const mainImage =
        fotosDoProduto[0] ||
        "https://via.placeholder.com/400x400?text=Sem+Imagem";

      return {
        id: prod.id,
        title: prod.title,
        price: `R$ ${parseFloat(prod.price).toFixed(2)}`,
        marca: prod.marca,
        barcode: prod.barcode,
        mainImage,
        thumbnails: fotosDoProduto,
        comercio: { nome: prod.comercioNome },

        // aqui, com parseFloat antes de toFixed:
        avgRating: Number(avg.toFixed(2)), // ex: 4.33
        stars: Math.round(avg), // ex: 4
        reviewsCount: prod.reviewsCount,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    return res.status(500).json({ error: "Erro ao listar produtos" });
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

// POST /api/products
exports.createProduct = async (req, res) => {
  const {
    nome,
    preco,
    descricao,
    marca,
    quantidade,
    codigoBarras,
    codigo_barras,
  } = req.body;

  const codigoBarrasFinal = codigoBarras || codigo_barras || null;

  const comercioId = req.userId;

  console.log("Dados recebidos:", {
    nome,
    preco,
    descricao,
    marca,
    quantidade,
    codigoBarrasFinal,
  });

  if (!nome || !preco) {
    return res.status(400).json({ error: "Nome e preço são obrigatórios" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO produtos (nome, preco, descricao, marca, quantidade, codigo_barras, fotos, comercio_id)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        nome,
        preco,
        descricao || null,
        marca || null,
        quantidade || null,
        codigoBarrasFinal,
        comercioId,
      ]
    );

    return res
      .status(201)
      .json({ id: result.insertId, message: "Produto criado" });
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao criar produto", details: err.message });
  }
};

// GET /api/produtos/meus
exports.getMyProducts = async (req, res) => {
  const comercioId = req.userId;
  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         nome,
         preco,
         descricao,
         marca,
         quantidade,
         codigo_barras AS barcode,
         fotos
       FROM produtos
       WHERE comercio_id = ?`,
      [comercioId]
    );

    // Converte preco de string para número em todos os itens
    const produtos = rows.map((p) => ({
      ...p,
      preco: parseFloat(p.preco),
    }));

    res.json(produtos);
  } catch (err) {
    console.error("Erro ao buscar meus produtos:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// PUT /api/produtos/:id
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const comercioId = req.userId;
  const {
    nome,
    preco,
    descricao,
    marca,
    quantidade,
    codigoBarras,
    codigo_barras,
  } = req.body;
  const barcode = codigoBarras || codigo_barras || null;

  try {
    // opcional: checar se o produto pertence a este comércio
    await pool.query(
      `UPDATE produtos
         SET nome = ?, preco = ?, descricao = ?, marca = ?, quantidade = ?, codigo_barras = ?
       WHERE id = ? AND comercio_id = ?`,
      [nome, preco, descricao, marca, quantidade, barcode, id, comercioId]
    );

    const [rows] = await pool.query(
      `SELECT id, nome, preco, descricao, marca, quantidade, codigo_barras AS barcode, fotos
   FROM produtos
   WHERE id = ?`,
      [id]
    );
    const atualizado = rows[0];
    atualizado.preco = parseFloat(atualizado.preco);

    res.json(atualizado);
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// DELETE /api/produtos/:id
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const comercioId = req.userId;
  try {
    await pool.query(
      `DELETE FROM produtos
       WHERE id = ? AND comercio_id = ?`,
      [id, comercioId]
    );
    res.json({ message: "Produto excluído" });
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};
