import DB from "../components/DBComponent.js";
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
   * Guarda el pedido principal y todos sus detalles dentro de la base de datos.
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
        datos_entrega:
          typeof payloadPedido.datos_entrega === "string"
            ? payloadPedido.datos_entrega
            : JSON.stringify(payloadPedido.datos_entrega),
        metodo_pago: payloadPedido.metodo_pago,
        total: payloadPedido.total,
        tipo_documento: payloadPedido.tipo_documento,
      },
    );

    const pedido = pedidoResult?.[0];
    if (!pedido) {
      throw new Error(
        "No se pudo registrar la cabecera del pedido en la base de datos.",
      );
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
   * Obtiene la lista de todos los pedidos para el panel administrativo.
   */
  async obtenerTodosLosPedidos(): Promise<PedidoListadoDbRecord[]> {
    const result = await this.db.excecuteNameQuery<PedidoListadoDbRecord>(
      "obtenerPedidos",
      {},
    );
    return result || [];
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
   * Actualiza el estado o fase del pedido.
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

  /**
   * Elimina un pedido por ID
   */
  async eliminarPedido(id: string): Promise<boolean> {
    try {
      const result = await this.db.excecuteNameQuery("eliminarPedido", { id });
      return !!(result && result.length > 0);
    } catch (error) {
      console.error("Error en repositorio al eliminar pedido:", error);
      return false;
    }
  }
}

export default new OrderRepository();
