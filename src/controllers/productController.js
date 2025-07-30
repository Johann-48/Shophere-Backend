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

      categoria_id: catRows[0]?.id || null,
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
        c.id   AS comercio_id,
        c.nome            AS commerceName,
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
        // expõe o ID da loja e o nome
        comercio: {
          id: prod.comercio_id,
          nome: prod.commerceName,
        },
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
    // 1. Buscar produtos da categoria
    const [produtos] = await pool.query(
      `
      SELECT p.id, p.marca, p.nome, p.preco, p.codigo_barras
      FROM produtos p
      JOIN produtos_categorias pc ON pc.produto_id = p.id
      WHERE pc.categoria_id = ?
      `,
      [categoriaId]
    );

    if (produtos.length === 0) return res.json([]);

    // 2. Buscar as imagens da tabela fotos_produto
    const ids = produtos.map((p) => p.id);
    const [fotos] = await pool.query(
      `
      SELECT produto_id, url, principal
      FROM fotos_produto
      WHERE produto_id IN (?)
      ORDER BY principal DESC, id ASC
      `,
      [ids]
    );

    // 3. Montar os dados finais
    const result = produtos.map((prod) => {
      const fotosDoProduto = fotos
        .filter((f) => f.produto_id === prod.id)
        .map((f) => f.url);

      const mainImage =
        fotosDoProduto[0] ||
        "https://via.placeholder.com/400x400?text=Sem+Imagem";

      return {
        id: prod.id,
        title: prod.nome,
        price: `R$ ${parseFloat(prod.preco).toFixed(2)}`,
        mainImage,
        thumbnails: fotosDoProduto,
        marca: prod.marca,
        codigo_barras: prod.codigo_barras,
        description: prod.marca
          ? `Produto da marca ${prod.marca}`
          : "Descrição não disponível",
        stock: true,
        stars: 0, // opcional: você pode adicionar as médias depois
      };
    });

    return res.json(result);
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
    const [rows] = await pool.query(
      `
      SELECT 
        p.id,
        p.nome      AS name,
        p.preco     AS price,
        p.descricao AS description,
        fp.url      AS mainImage,
        c.nome      AS commerceName
      FROM produtos p
      LEFT JOIN comercios c ON c.id = p.comercio_id
      LEFT JOIN fotos_produto fp
        ON fp.produto_id = p.id AND fp.principal = 1
      WHERE p.nome LIKE ?
      LIMIT 50
    `,
      [`%${q}%`]
    );
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
    fp.url        AS mainImage,
    c.nome        AS commerceName
  FROM produtos p
  LEFT JOIN comercios c ON p.comercio_id = c.id
  LEFT JOIN fotos_produto fp
    ON fp.produto_id = p.id AND fp.principal = 1
  WHERE p.comercio_id = ?
  `,
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
  p.codigo_barras AS barcode,
  CONCAT('http://localhost:4000/uploads/', fp.url) AS mainImage,
  c.nome AS commerceName
FROM produtos p
LEFT JOIN comercios c ON p.comercio_id = c.id
LEFT JOIN fotos_produto fp ON fp.produto_id = p.id AND fp.principal = 1
WHERE p.codigo_barras = ?

      `,
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
    // em ProductController.createProduct, depois de inserir em produtos:
    const [result] = await pool.query(
      `INSERT INTO produtos (nome, preco, descricao, marca, quantidade, codigo_barras, fotos, comercio_id)
   VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
      [nome, preco, descricao, marca, quantidade, codigoBarrasFinal, comercioId]
    );

    const produtoId = result.insertId;

    // 2) **GRAVAR** categoria, se veio do front‑end
    if (req.body.categoria_id) {
      await pool.query(
        `INSERT INTO produtos_categorias (produto_id, categoria_id)
     VALUES (?, ?)`,
        [produtoId, req.body.categoria_id]
      );
    }

    return res.status(201).json({ id: produtoId, message: "Produto criado" });
  } catch (err) {
    console.error("Erro ao criar produto:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao criar produto", details: err.message });
  }
};

// GET /api/produtos/meus
// GET /api/produtos/meus
exports.getMyProducts = async (req, res) => {
  const comercioId = req.userId;
  try {
    const [rows] = await pool.query(
      `SELECT 
         p.id,
         p.nome,
         p.preco,
         p.descricao,
         p.marca,
         p.quantidade,
         p.codigo_barras        AS codigoBarras,
         -- subconsulta para pegar a imagem principal
         (SELECT url 
            FROM fotos_produto fp
           WHERE fp.produto_id = p.id 
             AND fp.principal = 1
           LIMIT 1)          AS imagem,
         c.id                   AS categoria_id,
         c.nome                 AS categoria
       FROM produtos p
       LEFT JOIN produtos_categorias pc ON pc.produto_id = p.id
       LEFT JOIN categorias c            ON c.id = pc.categoria_id
       WHERE p.comercio_id = ?`,
      [comercioId]
    );

    // converte preco e renomeia campos para o frontend
    const produtos = rows.map((p) => ({
      ...p,
      preco: parseFloat(p.preco),
      imagem: p.imagem || null,
      codigoBarras: p.codigoBarras || "",
    }));

    res.json(produtos);
  } catch (err) {
    console.error("Erro ao buscar meus produtos:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// PUT /api/produtos/:id
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
    imagem, // esperamos a URL nova aqui
    categoria_id,
  } = req.body;

  try {
    // 1) Atualiza os campos básicos + código de barras
    await pool.query(
      `UPDATE produtos
         SET nome = ?, preco = ?, descricao = ?, marca = ?, quantidade = ?, codigo_barras = ?
       WHERE id = ? AND comercio_id = ?`,
      [nome, preco, descricao, marca, quantidade, codigoBarras, id, comercioId]
    );

    // 2) Atualiza categoria (se informado)
    if (categoria_id) {
      await pool.query(`DELETE FROM produtos_categorias WHERE produto_id = ?`, [
        id,
      ]);
      await pool.query(
        `INSERT INTO produtos_categorias (produto_id, categoria_id) VALUES (?, ?)`,
        [id, categoria_id]
      );
    }

    // 3) Atualiza foto principal caso venha nova URL
    if (imagem) {
      // primeiro zera todas como principal = 0
      await pool.query(
        `UPDATE fotos_produto SET principal = 0 WHERE produto_id = ?`,
        [id]
      );
      // depois marca a nova foto como principal,
      // ou insere se não existir
      const [fotos] = await pool.query(
        `SELECT id FROM fotos_produto WHERE produto_id = ? AND url = ?`,
        [id, imagem]
      );
      if (fotos.length) {
        await pool.query(
          `UPDATE fotos_produto SET principal = 1 WHERE id = ?`,
          [fotos[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO fotos_produto (produto_id, url, principal) VALUES (?, ?, 1)`,
          [id, imagem]
        );
      }
    }

    // 4) Retorna o produto atualizado (incluindo nova imagem e barcode)
    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.nome,
         p.preco,
         p.descricao,
         p.marca,
         p.quantidade,
         p.codigo_barras   AS codigoBarras,
         (SELECT url FROM fotos_produto fp 
            WHERE fp.produto_id = p.id AND fp.principal = 1 LIMIT 1
         )                  AS imagem
       FROM produtos p
       WHERE p.id = ?`,
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
