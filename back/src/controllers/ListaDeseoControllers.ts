import ListaDeseoRepository from "../repositories/ListaDeseoRepository";
import { Request, Response } from "express";
import {
  IListaDeseos,
  IListaDeseosPublica,
  IAgregarItemDTO,
} from "../interfaces/listaDeseo.interface";

class ListaDeseoController {
  constructor(private readonly listaDeseoRepository = ListaDeseoRepository) {}

  private resolveUserId(req: Request): string | null {
    const user = (req as any).user || req.session?.user;
    return user?.id ? String(user.id) : null;
  }

  async obtenerOCrearLista(req: Request, res: Response): Promise<Response> {
    try {
      const usuario_id = this.resolveUserId(req);

      if (!usuario_id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const listaDeseos: IListaDeseos[] =
        await this.listaDeseoRepository.obtenerOCrearLista(usuario_id);

      return res.status(200).json({ success: true, data: listaDeseos });
    } catch (error: any) {
      console.error("Error al obtener o crear la lista de deseos:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }

  async obtenerPorToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: "Token es requerido" });
      }
      const tokenString = Array.isArray(token) ? token[0] : token;
      const listaDeseosPublica: IListaDeseosPublica | null =
        await this.listaDeseoRepository.obtenerPorToken(tokenString);

      if (!listaDeseosPublica) {
        return res.status(404).json({ error: "Lista de deseos no encontrada" });
      }

      return res.status(200).json({ success: true, data: listaDeseosPublica });
    } catch (error: any) {
      console.error("Error al obtener la lista de deseos por token:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }

  async agregarItem(req: Request, res: Response): Promise<Response> {
    try {
      const { lista_id, item, cantidad } = req.body;

      if (!lista_id) {
        return res.status(400).json({ error: "Lista de deseos es requerida" });
      }

      if (!item || !cantidad) {
        return res
          .status(400)
          .json({ error: "Item y cantidad son requeridos" });
      }

      await this.listaDeseoRepository.agregarItem(lista_id, item, cantidad);

      return res.status(200).json({ success: true, data: item });
    } catch (error: any) {
      console.error("Error al agregar item a la lista de deseos:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }

  async eliminarItem(req: Request, res: Response): Promise<Response> {
    try {
      const { lista_id, producto_id } = req.body;

      if (!lista_id || !producto_id) {
        return res
          .status(400)
          .json({ error: "Lista de deseos y producto son requeridos" });
      }

      await this.listaDeseoRepository.eliminarItem(lista_id, producto_id);

      return res
        .status(200)
        .json({ success: true, data: { lista_id, producto_id } });
    } catch (error: any) {
      console.error("Error al eliminar item de la lista de deseos:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }

  async marcarComprado(req: Request, res: Response): Promise<Response> {
    try {
      const { item_id, comprado_por_nombre } = req.body;

      if (!item_id || !comprado_por_nombre) {
        return res
          .status(400)
          .json({ error: "Item ID y nombre del comprador son requeridos" });
      }

      await this.listaDeseoRepository.marcarComprado(
        item_id,
        comprado_por_nombre,
      );

      return res.status(200).json({
        success: true,
        data: { item_id, comprado_por_nombre },
      });
    } catch (error: any) {
      console.error("Error al marcar item como comprado:", error);
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  }
}

export default new ListaDeseoController();
