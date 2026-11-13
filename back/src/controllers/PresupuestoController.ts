import { Request, Response } from "express";
import ProductRepository from "../repositories/ProductRepository.js";
import PresupuestoRepository from "../repositories/PresupuestoRepository.js";

class PresupuestoController {
  constructor(private readonly presupuestoRepository = PresupuestoRepository) {}

  async getPresupuestos(req: Request, res: Response) {
    try {
      const data = await this.presupuestoRepository.listarPresupuestos();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener presupuestos",
        error: error.message,
      });
    }
  }

  async getPresupuestoPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await this.presupuestoRepository.obtenerPresupuestoPorId(
        id.toString(),
      );
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Presupuesto no encontrado" });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el presupuesto",
        error: error.message,
      });
    }
  }

  async crearPresupuesto(req: Request, res: Response) {
    try {
      const { detalles } = req.body;
      for (const detalle of detalles) {
        const producto = await ProductRepository.getProductoPorId(
          detalle.producto_id,
        );
        if (!producto) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${detalle.producto_id} no encontrado`,
          });
        }
      }
      const nuevoPresupuesto =
        await this.presupuestoRepository.crearPresupuesto(req.body);
      return res.status(201).json({
        success: true,
        message: "Presupuesto creado exitosamente",
        data: nuevoPresupuesto,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al crear presupuesto",
        error: error.message,
      });
    }
  }

  async actualizarEstado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const actualizado =
        await this.presupuestoRepository.actualizarEstadoPresupuesto(
          id.toString(),
          estado,
        );
      if (!actualizado)
        return res
          .status(404)
          .json({ success: false, message: "Presupuesto no encontrado" });
      return res.status(200).json({
        success: true,
        message: "Estado actualizado",
        data: actualizado,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar estado",
        error: error.message,
      });
    }
  }

  async eliminarPresupuesto(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eliminado = await this.presupuestoRepository.eliminarPresupuesto(
        id.toString(),
      );
      if (!eliminado)
        return res
          .status(404)
          .json({ success: false, message: "Presupuesto no encontrado" });
      return res.status(200).json({
        success: true,
        message: "Presupuesto eliminado exitosamente",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al eliminar presupuesto",
        error: error.message,
      });
    }
  }
}

export default new PresupuestoController();
