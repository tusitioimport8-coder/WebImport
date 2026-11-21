import { Request, Response } from "express";
import ProductRepository from "../repositories/ProductRepository.js";
import PresupuestoRepository from "../repositories/PresupuestoRepository.js";
import { generarLinkPresupuestoWhatsAppHelper } from "../utils/Messenge.js";
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

  async enviarPresupuesto(req: Request, res: Response) {
    try {
      const { presupuestoId, telefonoSolicitado } = req.body;

      console.log("Presupuesto ID recibido:", presupuestoId);
      console.log("Teléfono solicitado recibido:", telefonoSolicitado);
      if (!presupuestoId) {
        return res.status(400).json({
          success: false,
          message: "El ID del presupuesto es obligatorio",
        });
      }

      const presupuesto =
        await this.presupuestoRepository.obtenerPresupuestoPorId(presupuestoId);

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado",
        });
      }

      const detalles =
        await this.presupuestoRepository.obtenerDetallesPorPresupuestoId(
          presupuesto.id,
        );

      if (!detalles || detalles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "El presupuesto no tiene productos asociados",
        });
      }

      const itemsVerificados: Array<{
        nombre: string;
        cantidad: number;
        subtotal: number;
      }> = [];

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

        const cantidad = Number(detalle.cantidad);
        const precioUnitario = Number(detalle.precio_unitario);

        itemsVerificados.push({
          nombre: producto.nombre ?? "Producto",
          cantidad,
          subtotal: cantidad * precioUnitario,
        });
      }

      const telefonoRaw =
        telefonoSolicitado ||
        presupuesto.telefono ||
        process.env.WHATSAPP_EMPRESA ||
        "584129668437";

      const telefonoNormalizado = telefonoRaw.startsWith("0")
        ? `58${telefonoRaw.slice(1)}`
        : telefonoRaw;

      const { whatsappUrl, mensaje } = generarLinkPresupuestoWhatsAppHelper({
        telefonoDestino: telefonoNormalizado,
        datosPresupuesto: {
          idPresupuesto: presupuesto.id,
          clienteNombre: presupuesto.nombre_cliente,
          telefonoCliente: presupuesto.telefono,
          items: itemsVerificados,
          total: Number(presupuesto.total),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Enlace de WhatsApp generado exitosamente",
        data: {
          presupuestoId: presupuesto.id,
          telefono: telefonoNormalizado.replace(/\D/g, ""),
          whatsappUrl,
          mensaje,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al generar el envío del presupuesto por WhatsApp",
        error: error.message,
      });
    }
  }
}

export default new PresupuestoController();
