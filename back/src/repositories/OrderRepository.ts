import DB from "../components/DBComponent.js"; // Ajusta tu ruta de importación de base de datos según tu proyecto
import {
  EstadoPedido,
  GuardarPedidoInput,
  PedidoDbRecord,
  PedidoCreadoDbRecord,
  PedidoListadoDbRecord,
  PedidoConDetallesResponse,
  ProductoDbRecord,
} from "../interfaces/Orden.interface.js";
export class OrderRepository {
  constructor(private readonly db = DB) {}
  /**
   * Obtiene un producto por ID para validar precios reales y stock.
   */
  async obtenerProductoParaValidacion(
    id: string,
  ): Promise<ProductoDbRecord | null> {
    const result = await this.db.excecuteNameQuery<ProductoDbRecord>(
      "getProductoPorId",
      { id },
    );

    return result?.[0] || null;
  }

  /**
   * Guarda el pedido principal y todos sus detalles (ítems del localStorage) en una transacción.
   */
  async guardarPedidoConDetalles(
    payloadPedido: GuardarPedidoInput,
  ): Promise<PedidoCreadoDbRecord> {
    const pedidoResult = await this.db.excecuteNameQuery<PedidoCreadoDbRecord>(
      "crearPedido",
      {
        id_usuario: payloadPedido.id_usuario,
        nombre_completo: payloadPedido.nombre_completo,
        telefono: payloadPedido.telefono,
        correo: payloadPedido.correo,
        sede: payloadPedido.sede,
        direccion_base: payloadPedido.direccion_base ?? null,
        tipo_entrega: payloadPedido.tipo_entrega,
        datos_entrega: JSON.stringify(payloadPedido.datos_entrega),
        metodo_pago: payloadPedido.metodo_pago,
        total: payloadPedido.total,
      },
    );

    const pedido = pedidoResult?.[0];
    if (!pedido) {
      throw new Error("No se pudo crear el pedido");
    }

    for (const detalle of payloadPedido.detalles) {
      await this.db.excecuteNameQuery("crearDetallePedido", {
        id_pedido: pedido.id,
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
      });
    }

    return pedido;
  }

  /**
   * Obtiene la lista de todos los pedidos (para panel administrativo).
   */
  async obtenerTodosLosPedidos(): Promise<PedidoListadoDbRecord[]> {
    return (
      (await this.db.excecuteNameQuery<PedidoListadoDbRecord>(
        "obtenerPedidos",
        {},
      )) || []
    );
  }

  /**
   * Obtiene un pedido específico con sus ítems detallados.
   */
  async obtenerPedidoPorId(
    id: string,
  ): Promise<PedidoConDetallesResponse | null> {
    const result = await this.db.excecuteNameQuery<PedidoConDetallesResponse>(
      "obtenerPedidoPorId",
      { id },
    );
    return result?.[0] || null;
  }

  /**
   * Actualiza la fase/estado del pedido (ej: 'pendiente' -> 'procesando' -> 'completado').
   */
  async actualizarEstado(
    id: string,
    nuevoEstado: EstadoPedido,
  ): Promise<PedidoDbRecord | null> {
    const result = await this.db.excecuteNameQuery<PedidoDbRecord>(
      "actualizarEstadoPedido",
      { id, estado: nuevoEstado },
    );
    return result?.[0] || null;
  }
}

export default new OrderRepository();
