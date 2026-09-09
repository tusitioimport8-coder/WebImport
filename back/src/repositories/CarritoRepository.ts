import DB from "../components/DBComponent.js";
import {
  CarritoItemRaw,
  CarritoItemInput,
  CarritoItemUpdateInput,
} from "../interfaces/carrito.interface.js";

class CarritoRepository {
  constructor(private readonly db = DB) {}

  /**
   * Obtiene el carrito activo del usuario. Si no existe, lo crea.
   */
  async obtenerOCrearCarrito(
    usuarioId: string,
  ): Promise<{ id: string; usuario_id: string; estado: string }> {
    const result = await this.db.excecuteNameQuery(
      "obtenerOCrearCarritoActivo",
      {
        usuario_id: usuarioId,
      },
    );
    const carrito = result?.[0] || result;
    return carrito;
  }

  /**
   * Obtiene todos los productos del carrito activo con sus 3 precios base.
   */
  async obtenerProductosCarritoRaw(
    usuarioId: string,
  ): Promise<CarritoItemRaw[]> {
    const result = await this.db.excecuteNameQuery(
      "obtenerProductosCarritoRaw",
      {
        usuario_id: usuarioId,
      },
    );
    return result || [];
  }

  /**
   * Inserta un nuevo producto o suma la cantidad si ya existe (UPSERT).
   */
  async agregarOIncrementarItem(input: CarritoItemInput): Promise<any> {
    const result = await this.db.excecuteNameQuery("upsertItemCarritoSimple", {
      carrito_id: input.carrito_id,
      producto_id: input.producto_id,
      cantidad: input.cantidad,
    });
    return result?.[0] || result;
  }

  /**
   * Reemplaza/actualiza de forma exacta la cantidad de un ítem en el carrito.
   */
  async actualizarCantidadItem(input: CarritoItemUpdateInput): Promise<any> {
    const result = await this.db.excecuteNameQuery(
      "actualizarCantidadItemCarrito",
      {
        carrito_id: input.carrito_id,
        producto_id: input.producto_id,
        cantidad: input.cantidad,
      },
    );
    return result?.[0] || result;
  }

  /**
   * Elimina un producto específico del carrito.
   */
  async eliminarItem(carritoId: string, productoId: string): Promise<void> {
    await this.db.excecuteNameQuery("eliminarItemCarrito", {
      carrito_id: carritoId,
      producto_id: productoId,
    });
  }

  /**
   * Vacía todos los ítems del carrito activo.
   */
  async vaciarCarrito(carritoId: string): Promise<void> {
    await this.db.excecuteNameQuery("vaciarCarrito", {
      carrito_id: carritoId,
    });
  }
}

export default new CarritoRepository();
