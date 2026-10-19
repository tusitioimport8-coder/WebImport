import { Request, Response } from "express";
import OrderRepository from "../repositories/OrderRepository.js";
import {
  CrearPedidoRequestDTO,
  GuardarPedidoInput,
} from "../interfaces/Orden.interface.js";

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
        return res.status(400).json({
          success: false,
          message: "El carrito está vacío",
        });
      }

      if (!contacto || !entrega || !pago) {
        return res.status(400).json({
          success: false,
          message:
            "Faltan datos obligatorios en el formulario de pedido (contacto, entrega o pago)",
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
            message: `Producto con ID ${item.producto_id} no encontrado o inactivo`,
          });
        }

        totalUnidades += item.cantidad;
        montoBaseDetal += Number(producto.precio_detal) * item.cantidad;
        productosValidados.push({ producto, cantidad: item.cantidad });
      }

      // Determinar nivel de precio aplicable según tus reglas de negocio
      let tipoPrecio: "Detal" | "Mayor" | "GranMayor" = "Detal";
      if (totalUnidades >= 40 && montoBaseDetal >= 200) {
        tipoPrecio = "GranMayor";
      } else if (totalUnidades >= 6 && montoBaseDetal >= 50) {
        tipoPrecio = "Mayor";
      }

      // 3. Construir los detalles calculando precios unitarios finales
      let totalPedido = 0;
      const detallesProcesados = [];

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
          cantidad: cantidad,
          precio_unitario: precioFinal,
        });
      }

      // 4. Obtener ID de usuario si inició sesión de forma opcional durante el checkout
      const usuarioId = req.session?.user?.id
        ? String(req.session.user.id)
        : null;

      // 5. Armar el payload estructurado para el repositorio
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

      // 6. Persistir en la base de datos a través del repositorio
      const pedidoCreado =
        await this.orderRepository.guardarPedidoConDetalles(payloadPedido);

      return res.status(201).json({
        success: true,
        message: "¡Pedido registrado exitosamente!",
        data: pedidoCreado,
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
}

export default new OrderController();
