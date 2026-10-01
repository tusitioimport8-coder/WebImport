import { Request, Response } from "express";
import storageService, { StorageFolder } from "../components/StorageComponent";

// Tipos MIME permitidos según el destino
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function solicitarPresignedUrl(req: Request, res: Response) {
  try {
    const { nombreArchivo, tipoMime, destino } = req.body;

    // 1. Validar que vengan los datos obligatorios
    if (!nombreArchivo || !tipoMime) {
      return res.status(400).json({
        success: false,
        message: "nombreArchivo y tipoMime son obligatorios",
      });
    }

    // 2. Restringir tipos de archivo
    if (!ALLOWED_MIME_TYPES.includes(tipoMime)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de archivo no permitido. Tipos aceptados: ${ALLOWED_MIME_TYPES.join(", ")}`,
      });
    }

    // 3. Mapear la carpeta de destino basada en el enum
    let carpeta = StorageFolder.PRODUCTO_IMAGEN;
    if (destino === "avatar") carpeta = StorageFolder.USUARIO_AVATAR;
    if (destino === "video") carpeta = StorageFolder.PRODUCTO_VIDEO;

    // 4. Generar la URL firmada
    const result = await storageService.generarPresignedUrl(
      nombreArchivo,
      tipoMime,
      carpeta,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al generar la URL de subida",
    });
  }
}
