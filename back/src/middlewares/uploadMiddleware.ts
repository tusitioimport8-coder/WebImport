import { Request, Response } from "express";
import storageService, { StorageFolder } from "../components/StorageComponent";

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];

const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES];

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

    // 3. Validar y mapear la carpeta de destino
    if (!destino) {
      return res.status(400).json({
        success: false,
        message:
          "El campo 'destino' es obligatorio y debe ser uno de los siguientes: 'banners', 'usuarios', 'productos', 'avatar', 'video'",
      });
    }

    let carpeta: StorageFolder | string;

    if (destino === "banners" || destino === "banner") {
      carpeta = StorageFolder.IMAGENES_BANNER; // "banners/imagenes"
    } else if (
      destino === "usuarios" ||
      destino === "usuario" ||
      destino === "avatar"
    ) {
      carpeta = StorageFolder.USUARIO_AVATAR; // "usuarios/avatars"
    } else if (destino === "productos" || destino === "producto") {
      carpeta = StorageFolder.PRODUCTO_IMAGEN; // "productos/imagenes"
    } else if (destino === "video") {
      carpeta = StorageFolder.PRODUCTO_VIDEO;
    } else {
      return res.status(400).json({
        success: false,
        message: `Destino '${destino}' no válido`,
      });
    }

    // 4. Evitar mezclar videos con destinos exclusivos de imagen
    if (VIDEO_MIME_TYPES.includes(tipoMime) && destino !== "video") {
      return res.status(400).json({
        success: false,
        message:
          "Los archivos de video solo se permiten cuando el destino es 'video'",
      });
    }

    // 5. Generar la URL firmada
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
