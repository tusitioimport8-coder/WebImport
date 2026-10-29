import { Request, Response } from "express";
import OrderRepository from "../repositories/OrderRepository.js";
import OrderService from "../service/OrdenService.js";
import { CrearPedidoRequestDTO } from "../interfaces/Orden.interface.js";

export class OrderController {
  constructor(
    private readonly orderRepository = OrderRepository,
    private readonly orderService = OrderService,
  ) {}

  /**
   * POST /api/pedidos
   * Procesa el checkout de invitados o usuarios logueados.
   */
  async crearPedido(req: Request, res: Response): Promise<Response> {
    try {
      const body: CrearPedidoRequestDTO = req.body;
      const { contacto, entrega, pago, items } = body;

      // 1. Validaciones básicas de entrada HTTP
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

      const usuarioId = req.session?.user?.id
        ? String(req.session.user.id)
        : null;

      // 2. Delegar la lógica de negocio al Servicio
      const resultado = await this.orderService.procesarCheckout(
        body,
        usuarioId,
      );

      return res.status(201).json({
        success: true,
        message: "¡Pedido registrado exitosamente!",
        data: resultado,
      });
    } catch (error: any) {
      if (error.message?.startsWith("PRODUCT_NOT_FOUND:")) {
        const productoId = error.message.split(":")[1];
        return res.status(404).json({
          success: false,
          message: `Producto ${productoId} no encontrado`,
        });
      }

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
   * Obtiene la lista completa de pedidos (Admin / Fuerza de Ventas).
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
      const fueEliminado = await this.orderRepository.eliminarPedido(
        id.toString(),
      );

      if (!fueEliminado) {
        return res.status(404).json({
          success: false,
          message: "Pedido no encontrado para eliminar",
        });
      }

      return res.json({
        success: true,
        message: "Pedido eliminado correctamente",
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
