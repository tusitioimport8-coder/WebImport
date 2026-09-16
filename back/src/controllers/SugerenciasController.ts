import SugerenciasRepository from "../repositories/SugerenciasRepository.js";
import { Request, Response } from "express";

class SugerenciasController {
  // Normalizamos a minúsculas y snake_case para evitar errores tipográficos
  private readonly PESOS_EVENTO: Record<string, number> = {
    vista: 1,
    lista_deseos: 3,
    carrito: 5,
    compra: 10,
  };

  constructor(private readonly sugerenciasRepository = SugerenciasRepository) {}

  private resolveUserId(req: Request): string | null {
    const user = (req as any).user || req.session?.user;
    return user?.id ? String(user.id) : null;
  }

  async agregarSugerencia(req: Request, res: Response): Promise<Response> {
    try {
      const usuario_id = this.resolveUserId(req);

      if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const { producto_id, tipo_evento } = req.body;

      if (!producto_id || !tipo_evento) {
        return res.status(400).json({
          error: "Faltan parámetros requeridos ('producto_id' y 'tipo_evento')",
        });
      }

      if (
        !Object.prototype.hasOwnProperty.call(this.PESOS_EVENTO, tipo_evento)
      ) {
        return res.status(400).json({ error: "Tipo de evento inválido" });
      }

      const peso = this.PESOS_EVENTO[tipo_evento];

      await this.sugerenciasRepository.agregarSugerencia(
        usuario_id,
        producto_id,
        tipo_evento,
        peso,
      );

      return res.status(201).json({
        success: true,
        message: "Interacción registrada exitosamente",
      });
    } catch (error: any) {
      console.error("Error al agregar sugerencia:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }

  async obtenerSugerencias(req: Request, res: Response): Promise<Response> {
    try {
      const usuario_id = this.resolveUserId(req);
      const { limite } = req.query;

      if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      // MEJORA: Si no envían 'limite', asignamos un valor por defecto (ej. 10) en vez de fallar
      const limiteNumerico =
        limite && !isNaN(Number(limite)) ? Number(limite) : 10;

      const productosSugeridos =
        await this.sugerenciasRepository.obtenerSugerencias(
          usuario_id,
          limiteNumerico,
        );

      return res.status(200).json({
        success: true,
        data: productosSugeridos,
      });
    } catch (error: any) {
      console.error("Error al obtener sugerencias:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }
}

export default new SugerenciasController();
