import DB from "../components/DBComponent.js";
import {
  Producto,
  CrearProductoDTO,
  ActualizarProductoDTO,
  AgregarImagenDTO,
  ProductoConDetallesDTO,
  Categoria,
  ProductoImagen,
} from "../interfaces/producto.interface";

class ProductRepository {
  constructor(private readonly db = DB) {}
  // ==========================================
  // METODOS DE PRODUCTOS (E-commerce)
  // ==========================================
  async getProductos(): Promise<ProductoConDetallesDTO[]> {
    const result = await this.db.excecuteNameQuery("getProductos", {});
    return result || [];
  }

  async getProductoPorId(
    id: string,
  ): Promise<ProductoConDetallesDTO | undefined> {
    const result = await this.db.excecuteNameQuery("getProductoPorId", { id });
    const producto = result?.[0];

    if (!producto) return undefined;

    const categoriasResult = await this.db.excecuteNameQuery(
      "getCategoriasPorProducto",
      { producto_id: id },
    );
    const galeriaResult = await this.db.excecuteNameQuery(
      "getGaleriaProducto",
      { producto_id: id },
    );

    const categorias: Categoria[] = categoriasResult ?? [];
    const galeria: ProductoImagen[] = galeriaResult ?? [];

    return {
      ...producto,
      categorias: categorias || [],
      galeria: galeria || [],
    };
  }

  async crearProducto(datos: CrearProductoDTO): Promise<{ id: string }> {
    // 1. Inserción de la entidad base 'productos'
    const payload = {
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      descuento_porcentaje: datos.descuento_porcentaje ?? 0,
      imagen_url: datos.imagen_url ?? null,
      video_url: datos.video_url ?? null,
      stock: datos.stock ?? 0,
    };

    const result = await this.db.excecuteNameQuery("crearProducto", payload);
    const nuevoProducto = result?.[0] || result;

    // 2. Inserción de Precios (Detal, Mayor, GranMayor) en precios_productos
    if (datos.precios && datos.precios.length > 0) {
      await Promise.all(
        datos.precios.map((precioItem) =>
          this.db.excecuteNameQuery("agregarPrecioProducto", {
            id_producto: nuevoProducto.id,
            tipo_precio: precioItem.tipo_precio,
            precio: precioItem.precio,
          }),
        ),
      );
    }

    // 3. Inserción de Categorías asociadas
    if (datos.categorias_ids && datos.categorias_ids.length > 0) {
      await Promise.all(
        datos.categorias_ids.map((categoriaId) =>
          this.db.excecuteNameQuery("asociarCategoriaProducto", {
            producto_id: nuevoProducto.id,
            categoria_id: categoriaId,
          }),
        ),
      );
    }

    return nuevoProducto;
  }

  async agregarImagenGaleria(datos: AgregarImagenDTO): Promise<ProductoImagen> {
    const payload = {
      producto_id: datos.producto_id,
      url: datos.url,
      es_principal: datos.es_principal ?? false,
    };

    const result = await this.db.excecuteNameQuery(
      "agregarImagenGaleria",
      payload,
    );
    return result?.[0];
  }

  async actualizarProducto(
    datos: ActualizarProductoDTO,
  ): Promise<ProductoConDetallesDTO | undefined> {
    // 1. Extraer payload sin el campo 'precio' para la tabla 'productos'
    const payload = {
      id: datos.id,
      nombre: datos.nombre ?? null,
      descripcion: datos.descripcion ?? null,
      descuento_porcentaje: datos.descuento_porcentaje ?? null,
      imagen_url: datos.imagen_url ?? null,
      video_url: datos.video_url ?? null,
      stock: datos.stock ?? null,
      estado: datos.estado ?? null,
    };

    // 2. Ejecutar la actualización de la entidad base
    const result = await this.db.excecuteNameQuery(
      "actualizarProducto",
      payload,
    );
    const productoActualizado = result?.[0];

    if (!productoActualizado) {
      return undefined;
    }

    // 3. Si se enviaron precios para actualizar, procesarlos en precios_productos
    if (datos.precios && datos.precios.length > 0) {
      await Promise.all(
        datos.precios.map((precioItem) =>
          this.db.excecuteNameQuery("upsertPrecioProducto", {
            id_producto: datos.id,
            tipo_precio: precioItem.tipo_precio,
            precio: precioItem.precio,
          }),
        ),
      );
    }

    return productoActualizado;
  }

  async eliminarProducto(id: string): Promise<void> {
    await this.db.excecuteNameQuery("eliminarProducto", { id });
  }
}

export default new ProductRepository();
