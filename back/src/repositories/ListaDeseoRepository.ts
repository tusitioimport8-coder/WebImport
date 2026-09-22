import DB from "../components/DBComponent.js";
import {
  IListaDeseos,
  IListaDeseosPublica,
} from "../interfaces/listaDeseo.interface.js";

class WishlistRepository {
  constructor(private readonly db = DB) {}

  async obtenerOCrearLista(usuario_id: string): Promise<IListaDeseos[]> {
    try {
      const result = await this.db.excecuteNameQuery<IListaDeseos>(
        "obtenerOCrearLista",
        { usuario_id },
      );

      return result || [];
    } catch (error) {
      console.error("Error al obtener o crear la lista de deseos:", error);
      throw new Error("Error al obtener o crear la lista de deseos");
    }
  }

  async obtenerPorToken(token: string): Promise<IListaDeseosPublica | null> {
    try {
      const result = await this.db.excecuteNameQuery<IListaDeseosPublica>(
        "obtenerListaPorToken",
        { token },
      );
      return result?.[0] || null;
    } catch (error) {
      console.error("Error al obtener la lista de deseos por token:", error);
      throw new Error("Error al obtener la lista de deseos por token");
    }
  }

  async agregarItem(lista_id: string, producto_id: string, cantidad: number) {
    try {
      const result = await this.db.excecuteNameQuery("agregarItemLista", {
        lista_id,
        producto_id,
        cantidad,
      });
      return result?.[0] || null;
    } catch (error) {
      console.error("Error al agregar item a la lista de deseos:", error);
      throw new Error("Error al agregar item a la lista de deseos");
    }
  }

  async eliminarItem(lista_id: string, producto_id: string): Promise<boolean> {
    try {
      const result = await this.db.excecuteNameQuery("eliminarItemLista", {
        lista_id,
        producto_id,
      });
      return result ? result[0].success === true : false;
    } catch (error) {
      console.error("Error al eliminar item de la lista de deseos:", error);
      throw new Error("Error al eliminar item de la lista de deseos");
    }
  }

  async marcarComprado(item_id: string, compradorNombre: string) {
    try {
      const result = await this.db.excecuteNameQuery("marcarItemComprado", {
        item_id,
        compradorNombre,
      });
      return result?.[0] || null;
    } catch (error) {
      console.error("Error al marcar item como comprado:", error);
      throw new Error("Error al marcar item como comprado");
    }
  }
}

export default new WishlistRepository();
