import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/productos";

    // Si la carpeta no existe, la crea de forma recursiva
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    // Carpeta donde se guardarán físicamente las imágenes
    cb(null, "uploads/productos");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Extrae la extensión (ej: ".jpg" o ".png")
    const fileName = `${uuidv4()}${ext}`; // Resultado: "a1b2c3d4-e5f6...jpg"
    cb(null, fileName); // Multer guarda el archivo físicamente con este nombre
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"));
    }
  },
});
