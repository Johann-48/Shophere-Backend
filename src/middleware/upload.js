// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Caminho absoluto para src/uploads
// const uploadsPath = path.join(__dirname, "uploads");

// // Se não existir, cria recursivamente
// if (!fs.existsSync(uploadsPath)) {
//   fs.mkdirSync(uploadsPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsPath);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + "-" + file.originalname;
//     cb(null, unique);
//   },
// });

//const upload = multer({ storage });

//module.exports = upload;
