import Validator from "../utils/productos.validator.js";
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

  // ==========================================
  // METODOS DE USUARIOS (E-commerce)
  // ==========================================

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

  async createProducto(request: Request, response: Response) {
    // 1. Extraer los archivos organizados por Multer
    const files = request.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const portadaFile = files?.["imagen"]?.[0];
    const galeriaFiles = files?.["galeria"] || [];

    if (!portadaFile) {
      return response.status(400).json({
        success: false,
        message: "La imagen de portada es obligatoria",
      });
    }

    // 2. Parsear tipos recibidos desde multipart/form-data
    const datos = {
      ...request.body,
      precios: request.body.precios ? JSON.parse(request.body.precios) : [],
      descuento_porcentaje: request.body.descuento_porcentaje
        ? Number(request.body.descuento_porcentaje)
        : undefined,
      stock: request.body.stock ? Number(request.body.stock) : undefined,
      categorias_ids: request.body.categorias_ids
        ? JSON.parse(request.body.categorias_ids)
        : undefined,
    };

    // 3. Validar con Zod
    const validation = await this.validator.validateProducto(datos);
    if (!validation.success) {
      return response.status(400).json({
        success: false,
        message: "Error de validación",
        error: validation.error.issues,
      });
    }

    // 4. Construir URL de la Portada Principal
    const portadaUrl = `${request.protocol}://${request.get("host")}/uploads/productos/${portadaFile.filename}`;

    // 5. Crear el producto en BD (guarda datos básicos + URL de portada)
    const productoCreado = await this.repository.crearProducto({
      ...validation.data,
      imagen_url: portadaUrl,
    });

    // 6. AQUÍ SE USA 'agregarImagenGaleria': Guardar las fotos secundarias en producto_imagenes
    if (galeriaFiles.length > 0) {
      await Promise.all(
        galeriaFiles.map((file) => {
          const url = `${request.protocol}://${request.get("host")}/uploads/productos/${file.filename}`;
          return this.repository.agregarImagenGaleria({
            producto_id: productoCreado.id,
            url: url,
            es_principal: false,
          });
        }),
      );
    }

    return response.status(201).json({
      success: true,
      message: "Producto creado exitosamente con su galería",
      data: productoCreado,
    });
  }

  // PUT /api/productos/:id
  async updateProducto(req: Request, response: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;

    // 1. Unificar params y body para validar con Zod
    const datos = {
      id,
      ...req.body,
      precio: req.body.precio ? Number(req.body.precio) : undefined,
      descuento_porcentaje: req.body.descuento_porcentaje
        ? Number(req.body.descuento_porcentaje)
        : undefined,
      stock: req.body.stock ? Number(req.body.stock) : undefined,
      estado:
        req.body.estado !== undefined
          ? req.body.estado === "true" || req.body.estado === true
          : undefined,
    };

    // 2. Validar campos
    const validation = await this.validator.validateActualizarProducto(datos);
    if (!validation.success) {
      return response.status(400).json({
        success: false,
        message: "Error de validación",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // 3. Verificar existencia del producto
    const productoExistente = await this.repository.getProductoPorId(id);
    if (!productoExistente) {
      return response.status(404).json({
        success: false,
        message: "El producto a actualizar no existe",
      });
    }

    // 4. Si se envió una nueva imagen de portada, armar la URL
    let nuevaImagenUrl = productoExistente.imagen_url;
    if (file) {
      nuevaImagenUrl = `${req.protocol}://${req.get("host")}/uploads/productos/${file.filename}`;
    }

    // 5. Actualizar en BD
    const productoActualizado = await this.repository.actualizarProducto({
      ...validation.data,
      imagen_url: nuevaImagenUrl,
    });

    return response.status(200).json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: productoActualizado,
    });
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
