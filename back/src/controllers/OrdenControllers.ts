import { Request, Response } from "express";
import OrderRepository from "../repositories/OrderRepository.js";
import {
  CrearPedidoRequestDTO,
  GuardarPedidoInput,
} from "../interfaces/Orden.interface.js";
import { generarLinkWhatsAppHelper } from "../utils/Messenge.js";
export class OrderController {
  constructor(private readonly orderRepository = OrderRepository) {}

  /**
   * POST /api/pedidos
   * Procesa el checkout de invitados o usuarios logueados utilizando los ítems del localStorage.
   */
  async crearPedido(req: Request, res: Response): Promise<Response> {
    try {
      const body: CrearPedidoRequestDTO = req.body;
      const { contacto, entrega, pago, items } = body;

      // 1. Validaciones iniciales
      if (!items || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "El carrito está vacío" });
      }

      if (!contacto || !entrega || !pago) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos obligatorios del pedido",
        });
      }

      // 2. Validar productos en la BD y calcular niveles de precio (Detal, Mayor, GranMayor)
      let totalUnidades = 0;
      let montoBaseDetal = 0;
      const productosValidados = [];

      for (const item of items) {
        const producto =
          await this.orderRepository.obtenerProductoParaValidacion(
            item.producto_id,
          );
        if (!producto) {
          return res.status(404).json({
            success: false,
            message: `Producto ${item.producto_id} no encontrado`,
          });
        }

        totalUnidades += item.cantidad;
        montoBaseDetal += Number(producto.precio_detal) * item.cantidad;
        productosValidados.push({ producto, cantidad: item.cantidad });
      }

      let tipoPrecio: "Detal" | "Mayor" | "GranMayor" = "Detal";
      if (totalUnidades >= 40 && montoBaseDetal >= 200) {
        tipoPrecio = "GranMayor";
      } else if (totalUnidades >= 6 && montoBaseDetal >= 50) {
        tipoPrecio = "Mayor";
      }

      // 3. Construir detalles y precios finales
      let totalPedido = 0;
      const detallesProcesados = [];
      const itemsParaWhatsApp = [];

      for (const { producto, cantidad } of productosValidados) {
        let precioUnitario = Number(producto.precio_detal);
        if (tipoPrecio === "Mayor")
          precioUnitario = Number(producto.precio_mayor);
        if (tipoPrecio === "GranMayor")
          precioUnitario = Number(producto.precio_gran_mayor);

        const descuento = Number(producto.descuento_porcentaje || 0);
        const precioFinal = Number(
          (precioUnitario * (1 - descuento / 100)).toFixed(2),
        );
        const subtotal = Number((precioFinal * cantidad).toFixed(2));

        totalPedido += subtotal;

        detallesProcesados.push({
          id_producto: producto.id,
          cantidad,
          precio_unitario: precioFinal,
        });

        itemsParaWhatsApp.push({
          nombre: producto.nombre,
          cantidad,
          subtotal,
        });
      }

      const usuarioId = req.session?.user?.id
        ? String(req.session.user.id)
        : null;

      const payloadPedido: GuardarPedidoInput = {
        id_usuario: usuarioId,
        nombre_completo: contacto.nombre_completo,
        telefono: contacto.telefono,
        correo: contacto.correo,
        sede: contacto.sede,
        direccion_base: contacto.direccion_base,
        tipo_entrega: entrega.tipo,
        datos_entrega: entrega.detalles,
        metodo_pago: pago.metodo,
        total: Number(totalPedido.toFixed(2)),
        detalles: detallesProcesados,
      };

      // 4. Guardar en Base de Datos (Neon)
      const pedidoCreado =
        await this.orderRepository.guardarPedidoConDetalles(payloadPedido);

      // =========================================================================
      // 5. LLAMADA AL MÓDULO DESACOPLADO DE WHATSAPP
      // =========================================================================
      const whatsappUrl = generarLinkWhatsAppHelper({
        telefonoEmpresa: process.env.WHATSAPP_EMPRESA || "584129668437",
        datosOrden: {
          idPedido: pedidoCreado.id,
          clienteNombre: contacto.nombre_completo,
          telefonoCliente: contacto.telefono,
          tipoEntrega: entrega.tipo,
          metodoPago: pago.metodo,
          nivelAplicado: tipoPrecio,
          items: itemsParaWhatsApp,
          totalPagar: Number(totalPedido.toFixed(2)),
        },
      });

      // 6. Respuesta final al frontend con la orden y la URL lista para redirigir
      return res.status(201).json({
        success: true,
        message: "¡Pedido registrado exitosamente!",
        data: {
          pedido: pedidoCreado,
          whatsappUrl: whatsappUrl,
        },
      });
    } catch (error: any) {
      console.error("Error al crear el pedido:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al procesar el pedido",
        details: error.message,
      });
    }
  }

  /**
   * GET /api/pedidos
   * Obtiene la lista completa de pedidos (para administradores).
   */
  async listarPedidos(req: Request, res: Response): Promise<Response> {
    try {
      const pedidos = await this.orderRepository.obtenerTodosLosPedidos();
      return res.json({
        success: true,
        data: pedidos,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener los pedidos",
        details: error.message,
      });
    }
  }

  /**
   * GET /api/pedidos/:id
   * Obtiene un pedido detallado con sus productos.
   */
  async obtenerPedido(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const pedido = await this.orderRepository.obtenerPedidoPorId(
        id.toString(),
      );

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: "Pedido no encontrado",
        });
      }

      return res.json({
        success: true,
        data: pedido,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el detalle del pedido",
        details: error.message,
      });
    }
  }

  /**
   * PATCH /api/pedidos/:id/estado
   * Actualiza el estado/fase de un pedido.
   */
  async cambiarEstadoPedido(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: "El campo 'estado' es requerido",
        });
      }

      const pedidoActualizado = await this.orderRepository.actualizarEstado(
        id.toString(),
        estado,
      );

      if (!pedidoActualizado) {
        return res.status(404).json({
          success: false,
          message: "Pedido no encontrado para actualizar",
        });
      }

      return res.json({
        success: true,
        message: "Estado del pedido actualizado correctamente",
        data: pedidoActualizado,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el estado del pedido",
        details: error.message,
      });
    }
  }

  /**
   * DELETE /api/pedidos/:id
   * Elimina un pedido específico.
   */

  async eliminarPedido(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const pedidoEliminado = await this.orderRepository.eliminarPedido(
        id.toString(),
      );

      if (!pedidoEliminado) {
        return res.status(404).json({
          success: false,
          message: "Pedido no encontrado para eliminar",
        });
      }

      return res.json({
        success: true,
        message: "Pedido eliminado correctamente",
        data: pedidoEliminado,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error al eliminar el pedido",
        details: error.message,
      });
    }
  }
}

export default new OrderController();
