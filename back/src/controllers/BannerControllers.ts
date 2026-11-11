import { Request, Response } from "express";
import BannerRepository from "../repositories/BannerRepository.js";
import storageService from "../components/StorageComponent.js";
import BannerValidator from "../utils/validator/BannerValidator.js";

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
      return res.status(500).json({
        success: false,
        message: "Error al obtener banners",
        details: error.message,
      });
    }
  }

  /**
   * POST /api/banners
   * Guarda o actualiza un banner y limpia las imágenes anteriores en S3
   */
  async guardarBanner(req: Request, res: Response): Promise<Response> {
    try {
      const { identificador, titulo, imagenes, activo } = req.body;

      const validationResult =
        await BannerValidator.validateCrearOActualizarBanner({
          identificador,
          titulo,
          imagenes,
          activo,
        });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          details: validationResult.error.flatten(),
        });
      }

      // 1. Buscar el banner existente para detectar imágenes anteriores
      const bannerExistente =
        await this.bannerRepo.obtenerPorIdentificador(identificador);

      if (bannerExistente && bannerExistente.imagenes) {
        const keysNuevos = new Set(imagenes.map((img: any) => img?.objectKey));

        for (const imgVieja of bannerExistente.imagenes) {
          // Ignorar imágenes nulas o sin objectKey
          if (imgVieja?.objectKey && !keysNuevos.has(imgVieja.objectKey)) {
            try {
              console.log(
                `🗑️ Eliminando archivo obsoleto de S3: ${imgVieja.objectKey}`,
              );

              await storageService.eliminarArchivo(imgVieja.objectKey);
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

  /**
   * GET /api/banners/:identificador
   * Obtiene un banner específico por su identificador
   */
  async obtenerBanner(req: Request, res: Response): Promise<Response> {
    try {
      const { identificador } = req.params;

      if (!identificador) {
        return res.status(400).json({
          success: false,
          message: "El campo 'identificador' es obligatorio",
        });
      }

      const banner = await this.bannerRepo.obtenerPorIdentificador(
        identificador.toString(),
      );

      if (!banner) {
        return res.status(404).json({
          success: false,
          message: `No se encontró un banner con el identificador '${identificador}'`,
        });
      }

      return res.json({ success: true, data: banner });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el banner",
        details: error.message,
      });
    }
  }

  /**
   * DELETE /api/banners/:identificador
   * Elimina un banner específico por su identificador
   */
  async eliminarBanner(req: Request, res: Response): Promise<Response> {
    try {
      const { identificador } = req.params;

      if (!identificador) {
        return res.status(400).json({
          success: false,
          message: "El campo 'identificador' es obligatorio",
        });
      }

      const bannerExistente = await this.bannerRepo.obtenerPorIdentificador(
        identificador.toString(),
      );

      if (!bannerExistente) {
        return res.status(404).json({
          success: false,
          message: `No se encontró un banner con el identificador '${identificador}'`,
        });
      }

      // Eliminar imágenes asociadas del bucket S3
      for (const img of bannerExistente.imagenes ?? []) {
        if (!img?.objectKey) continue;

        try {
          console.log(`🗑️ Eliminando archivo de S3: ${img.objectKey}`);
          await storageService.eliminarArchivo(img.objectKey);
        } catch (s3Error) {
          console.error(
            `⚠️ No se pudo eliminar la imagen de S3 (${img.objectKey}):`,
            s3Error,
          );
        }
      }

      // Eliminar el banner de la base de datos
      await this.bannerRepo.eliminarPorIdentificador(identificador.toString());

      return res.status(200).json({
        success: true,
        message: `Banner con identificador '${identificador}' eliminado exitosamente`,
      });
    } catch (error: any) {
      console.error("Error al eliminar banner:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al procesar la eliminación del banner",
        details: error.message,
      });
    }
  }
}

export default new BannerController();
