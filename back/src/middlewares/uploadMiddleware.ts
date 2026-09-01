// src/middlewares/uploadMiddleware.ts
import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { upload } from "../config/multer"; // Tu configuración actual

const uploadFields = upload.fields([
  { name: "imagen", maxCount: 1 },
  { name: "galeria", maxCount: 5 },
]);

export const handleProductoUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: "Error en la subida de imágenes",
        error:
          err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Excediste el límite de imágenes permitidas (máximo 1 portada y 5 en galería)"
            : err.message,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};
