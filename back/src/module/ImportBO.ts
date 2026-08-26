import Validator from "../utils/validator.js";
import Repository from "./Repository.js";
import { Request, Response } from "express";

class Bo {
  constructor(
    private readonly repository = Repository,
    private readonly validator = Validator,
  ) {
    this.repository = repository;
    this.validator = validator;
  }

  // ==========================================
  // METODOS DE USUARIOS (E-commerce)
  // ==========================================

  async getProductos() {
    return await this.repository.getProductos();
  }

  async getProductoPorId(id: string) {
    return await this.repository.getProductoPorId(id);
  }

  async createProducto(request: Request, response: Response) {
    const datos = request.body;

    // Validar los datos del producto
    const { success, error } = await this.validator.validateProducto(datos);
    if (!success) {
      return response.status(400).json({
        success: false,
        message: "Error de validación",
        error: error?.issues || "Datos inválidos",
      });
    }
    const productoCreado = await this.repository.crearProducto(datos);

    return response.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: productoCreado,
    });
  }
}

export default new Bo();
