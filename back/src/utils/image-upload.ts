import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// ==========================================
// CONFIGURACIÓN DE SUBIDA DE ARCHIVOS
// ==========================================

const UPLOADS_DIR = path.resolve("src/uploads/images");
const PERFILES_DIR = path.resolve("src/uploads/images/perfiles");

// Crear directorios si no existen
[UPLOADS_DIR, PERFILES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==========================================
// FILTRO DE ARCHIVOS PERMITIDOS
// ==========================================

const MIME_TYPES_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const EXTENSIONES_PERMITIDAS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/**
 * Valida que el archivo sea una imagen con formato permitido.
 */
function filtrarImagen(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!MIME_TYPES_PERMITIDOS.includes(file.mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
  if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
    return cb(new Error(`Extensión no permitida: ${ext}`));
  }
  cb(null, true);
}

// ==========================================
// STORAGE PARA IMÁGENES DE MENSAJES
// ==========================================

const storageMensajes = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ==========================================
// STORAGE PARA FOTOS DE PERFIL
// ==========================================

const storagePerfil = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PERFILES_DIR);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const uniqueName = `perfil-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// MIDDLEWARES EXPORTADOS
// ==========================================

/**
 * Middleware para subir imágenes en mensajes.
 * Límite: 5 MB. Campo esperado: "imagen".
 */
export const uploadImagenMensaje = multer({
  storage: storageMensajes,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: filtrarImagen,
}).single("imagen");

/**
 * Middleware para subir foto de perfil.
 * Límite: 5 MB. Campo esperado: "foto_perfil".
 */
export const uploadFotoPerfil = multer({
  storage: storagePerfil,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: filtrarImagen,
}).single("foto_perfil");

/**
 * URL base para acceder a los archivos subidos públicamente.
 */
export const UPLOADS_URL_BASE = "/uploads";
