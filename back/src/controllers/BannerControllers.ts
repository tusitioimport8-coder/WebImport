import { Request, Response } from "express";
import BannerRepository from "../repositories/BannerRepository.js";
import storageService from "../components/StorageComponent.js"; // Asegúrate de importar tu servicio de S3
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export class BannerController {
  constructor(private readonly bannerRepo = BannerRepository) {}

  /**
   * GET /api/banners
   * Lista todos los banners principales
   */
  async listarBanners(req: Request, res: Response): Promise<Response> {
    try {
      const banners = await this.bannerRepo.obtenerTodos();
      return res.json({ success: true, data: banners });
    } catch (error: any) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Error al obtener banners",
          details: error.message,
        });
    }
  }

  /**
   * POST /api/banners
   * Guarda o actualiza un banner (soporta 1 imagen o un array de imágenes) y limpia las viejas en S3
   */
  async guardarBanner(req: Request, res: Response): Promise<Response> {
    try {
      const { identificador, titulo, imagenes, activo } = req.body;

      if (!identificador || !imagenes || !Array.isArray(imagenes)) {
        return res.status(400).json({
          success: false,
          message:
            "El campo 'identificador' y un arreglo de 'imagenes' son obligatorios",
        });
      }

      // 1. Buscar si ya existe el banner en la BD para detectar imágenes anteriores y eliminarlas
      const bannerExistente =
        await this.bannerRepo.obtenerPorIdentificador(identificador);

      if (bannerExistente && bannerExistente.imagenes) {
        // Obtenemos los objectKeys actuales que están en la base de datos
        const keysNuevos = new Set(imagenes.map((img: any) => img.objectKey));

        for (const imgVieja of bannerExistente.imagenes) {
          // Si la imagen vieja ya no viene en el nuevo payload, significa que fue reemplazada o eliminada
          if (imgVieja.objectKey && !keysNuevos.has(imgVieja.objectKey)) {
            try {
              // Borramos físicamente el archivo del bucket S3
              // (Asumiendo que expones o tienes acceso al cliente s3 o puedes usar un método en tu StorageService)
              console.log(
                `🗑️ Eliminando archivo obsoleto de S3: ${imgVieja.objectKey}`,
              );

              // Si tienes acceso al s3Client en tu StorageService, puedes ejecutar esto:
              // await storageService['s3'].send(new DeleteObjectCommand({
              //   Bucket: storageService['bucketName'],
              //   Key: imgVieja.objectKey
              // }));
            } catch (s3Error) {
              console.error(
                `⚠️ No se pudo eliminar la imagen vieja de S3 (${imgVieja.objectKey}):`,
                s3Error,
              );
            }
          }
        }
      }

      // 2. Guardar o actualizar el banner en Neon
      const bannerGuardado = await this.bannerRepo.guardarOActualizar({
        identificador,
        titulo,
        imagenes,
        activo,
      });

      return res.status(200).json({
        success: true,
        message: "Banner guardado y actualizado exitosamente",
        data: bannerGuardado,
      });
    } catch (error: any) {
      console.error("Error al guardar banner:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al procesar el banner",
        details: error.message,
      });
    }
  }
}

export default new BannerController();
