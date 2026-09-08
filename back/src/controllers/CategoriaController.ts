import CategoriaRepository from "../repositories/CategoritaRepository";
import { Request, Response } from "express";
import {
  Categoria,
  CrearCategoria,
  ActualizarCategoria,
} from "../interfaces/categoria.interface";

class CategoriaController {
  constructor(private readonly repository = CategoriaRepository) {}

  async obtenerCategorias(req: Request, res: Response): Promise<void> {
    try {
      const categorias = await this.repository.obtenerCategorias();

      if (!categorias || categorias.length === 0) {
        res.status(404).json({ error: "No se encontraron categorías" });
        return;
      }
      res.status(200).json(categorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async obtenerCategoriaPorId(req: Request, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id: number = parseInt(rawId, 10);
    try {
      const categoria = await this.repository.obtenerCategoriaPorId(id);
      if (categoria) {
        res.status(200).json(categoria);
      } else {
        res.status(404).json({ error: "Categoría no encontrada" });
      }
    } catch (error) {
      console.error("Error al obtener categoría por ID:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async crearCategoria(req: Request, res: Response): Promise<void> {
    const data: CrearCategoria = req.body;
    try {
      const nuevaCategoria = await this.repository.crearCategoria(data);
      res.status(201).json(nuevaCategoria);
    } catch (error) {
      console.error("Error al crear categoría:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async actualizarCategoria(req: Request, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id: number = parseInt(rawId, 10);
    const data: ActualizarCategoria = req.body;
    try {
      const categoriaActualizada = await this.repository.actualizarCategoria(
        id,
        data,
      );
      if (categoriaActualizada) {
        res.status(200).json(categoriaActualizada);
      } else {
        res.status(404).json({ error: "Categoría no encontrada" });
      }
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async eliminarCategoria(req: Request, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id: number = parseInt(rawId, 10);
    try {
      const exito = await this.repository.eliminarCategoria(id);
      if (exito) {
        res.status(200).json({ message: "Categoría eliminada exitosamente" });
      } else {
        res.status(404).json({ error: "Categoría no encontrada" });
      }
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

export default new CategoriaController();
