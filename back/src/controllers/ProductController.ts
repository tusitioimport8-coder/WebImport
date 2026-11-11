import Validator from "../utils/validator/productos.validator.js";
import ProductRepository from "../repositories/ProductRepository.js";
import { Request, Response } from "express";

class ProductController {
  constructor(
    private readonly repository = ProductRepository,
    private readonly validator = Validator,
  ) {
    this.repository = repository;
    this.validator = validator;
  }

  // GET /api/productos
  async getProductos(request: Request, response: Response) {
    try {
      const productos = await this.repository.getProductos();
      return response.status(200).json({
        success: true,
        data: productos,
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error al obtener la lista de productos",
      });
    }
  }

  // GET /api/productos/:id
  async getProductoPorId(request: Request, response: Response) {
    const id = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    if (!id) {
      return response.status(400).json({
        success: false,
        message: "El parámetro ID es requerido",
      });
    }

    try {
      const producto = await this.repository.getProductoPorId(id);

      if (!producto) {
        return response.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      return response.status(200).json({
        success: true,
        data: producto,
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error al obtener el producto",
      });
    }
  }

  // POST /api/productos (Acepta JSON puro)
  async createProducto(request: Request, response: Response) {
    try {
      // 1. Validar el body JSON directo recibido del cliente
      const validation = await this.validator.validateCrearProducto(
        request.body,
      );

      console.log("Validation result:", validation);

      if (!validation.success) {
        return response.status(400).json({
          success: false,
          message: "Error de validación",
          error: validation.error.issues,
        });
      }

      //  2. Guardar producto base (recibe imagen_url directamente en validation.data)
      const productoCreado = await this.repository.crearProducto(
        validation.data,
      );

      // 3. Procesar URLs de galería enviadas como un arreglo de strings en el JSON
      const galeriaUrls: string[] = request.body.galeria || [];
      if (galeriaUrls.length > 0) {
        await Promise.all(
          galeriaUrls.map((url) =>
            this.repository.agregarImagenGaleria({
              producto_id: productoCreado.id,
              url,
              es_principal: false,
            }),
          ),
        );
      }

      return response.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: productoCreado,
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error al crear el producto",
      });
    }
  }

  // PUT /api/productos/:id (Acepta JSON puro)
  async updateProducto(req: Request, response: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    try {
      // 1. Unificar params e ID para validar
      const validation = await this.validator.validateActualizarProducto({
        id,
        ...req.body,
      });

      if (!validation.success) {
        return response.status(400).json({
          success: false,
          message: "Error de validación",
          errors: validation.error.flatten().fieldErrors,
        });
      }

      // 2. Verificar existencia previa
      const productoExistente = await this.repository.getProductoPorId(id);
      if (!productoExistente) {
        return response.status(404).json({
          success: false,
          message: "El producto a actualizar no existe",
        });
      }

      // 3. Actualizar en base de datos
      const productoActualizado = await this.repository.actualizarProducto({
        ...validation.data,
        imagen_url: validation.data.imagen_url ?? undefined,
        video_url: validation.data.video_url ?? undefined,
      });

      return response.status(200).json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: productoActualizado,
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error al actualizar el producto",
      });
    }
  }

  // DELETE /api/productos/:id
  async deleteProducto(req: Request, response: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return response.status(400).json({
        success: false,
        message: "El parámetro ID es requerido",
      });
    }

    try {
      const productoExistente = await this.repository.getProductoPorId(id);
      if (!productoExistente) {
        return response.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      await this.repository.eliminarProducto(id);

      return response.status(200).json({
        success: true,
        message: "Producto eliminado exitosamente",
      });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Error al eliminar el producto",
      });
    }
  }
}

export default new ProductController();
