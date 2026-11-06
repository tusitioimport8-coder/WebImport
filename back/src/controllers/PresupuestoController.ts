import { Request, Response } from "express";
import PresupuestoRepository from "../repositories/PresupuestoRepository.js";
import crypto from "crypto";

export class PresupuestoController {
  constructor(private readonly repo = PresupuestoRepository) {}

  async crearPresupuesto(req: Request, res: Response): Promise<Response> {
    try {
      const { usuario_id, total } = req.body;
      const id = `presupuesto-${crypto.randomUUID()}`;

      const nuevoPresupuesto = await this.repo.crearPresupuesto({
        id,
        usuario_id,
        total,
      });

      return res.status(201).json({
        success: true,
        message: "Presupuesto creado exitosamente",
        data: nuevoPresupuesto,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al crear presupuesto",
        details: error.message,
      });
    }
  }

  async listarPresupuestos(req: Request, res: Response): Promise<Response> {
    try {
      const lista = await this.repo.listarPresupuestos();
      return res.json({
        success: true,
        data: lista,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al listar presupuestos",
        details: error.message,
      });
    }
  }

  async cambiarEstado(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const actualizado = await this.repo.actualizarEstadoPresupuesto(
        id.toString(),
        estado,
      );

      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Estado del presupuesto actualizado correctamente",
        data: actualizado,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el estado del presupuesto",
        details: error.message,
      });
    }
  }

  async obtenerPresupuestoPorId(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const presupuesto = await this.repo.obtenerPresupuestoPorId(
        id.toString(),
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado",
        });
      }

      return res.json({
        success: true,
        data: presupuesto,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el presupuesto",
        details: error.message,
      });
    }
  }

  async eliminarPresupuesto(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const eliminado = await this.repo.eliminarPresupuesto(id.toString());

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Presupuesto eliminado correctamente",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al eliminar el presupuesto",
        details: error.message,
      });
    }
  }
}

export default new PresupuestoController();
