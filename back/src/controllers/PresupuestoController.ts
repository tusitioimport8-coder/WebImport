import { Request, Response } from "express";
import ProductRepository from "../repositories/ProductRepository.js";
import PresupuestoRepository from "../repositories/PresupuestoRepository.js";
import { generarLinkPresupuestoWhatsAppHelper } from "../utils/Messenge.js";
import {
  crearPresupuestoSchema,
  editarPresupuestoSchema,
} from "../utils/validator/presupuesto.validator.js";
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
      const parsed = crearPresupuestoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos para crear el presupuesto",
          errors: parsed.error.flatten(),
        });
      }

      const detallesConPrecio: Array<
        (typeof parsed.data.detalles)[number] & { precio_unitario: number }
      > = [];
      for (const detalle of parsed.data.detalles) {
        const producto = await ProductRepository.getProductoPorId(
          detalle.producto_id,
        );
        if (!producto) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${detalle.producto_id} no encontrado`,
          });
        }

        const precio = producto.precios?.find(
          (item) => item.tipo_precio === detalle.tipo_precio,
        );
        if (!precio) {
          return res.status(400).json({
            success: false,
            message: `El producto con ID ${detalle.producto_id} no tiene precio tipo ${detalle.tipo_precio}`,
          });
        }

        detallesConPrecio.push({
          ...detalle,
          precio_unitario: Number(precio.precio),
        });
      }

      const subtotal = detallesConPrecio.reduce(
        (total, detalle) => total + detalle.precio_unitario * detalle.cantidad,
        0,
      );
      const descuento = parsed.data.descuento ?? 0;
      const total = Number((subtotal * (1 - descuento / 100)).toFixed(2));

      const nuevoPresupuesto =
        await this.presupuestoRepository.crearPresupuesto({
          ...parsed.data,
          total,
          detalles: detallesConPrecio,
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
        tipo_precio: (typeof detalles)[number]["tipo_precio"];
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
          tipo_precio: detalle.tipo_precio,
        });
      }

      const telefonoRaw =
        telefonoSolicitado ||
        presupuesto.telefono_cliente ||
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
          telefonoCliente: presupuesto.telefono_cliente ?? undefined,
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

  async editarPresupuesto(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ message: "El id del presupuesto es obligatorio" });
        return;
      }

      const parsed = editarPresupuestoSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: "Datos inválidos para editar el presupuesto",
          errors: parsed.error.flatten(),
        });
        return;
      }

      const presupuestoActualizado =
        await this.presupuestoRepository.editarPresupuesto({
          id: id.toString(),
          ...parsed.data,
        });

      if (!presupuestoActualizado) {
        res.status(404).json({ message: "Presupuesto no encontrado" });
        return;
      }

      res.status(200).json({
        message: "Presupuesto actualizado correctamente",
        data: presupuestoActualizado,
      });
    } catch (error) {
      console.error("Error en editarPresupuesto:", error);
      if (
        error instanceof Error &&
        error.message.startsWith("Producto con ID")
      ) {
        res.status(404).json({ message: error.message });
        return;
      }
      if (
        error instanceof Error &&
        error.message.startsWith("Precio tipo")
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
      res
        .status(500)
        .json({ message: "Error interno al editar el presupuesto" });
    }
  }
}

export default new PresupuestoController();
