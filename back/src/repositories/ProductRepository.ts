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
    // 1. Extraemos solo los campos que la consulta SQL "crearProducto" espera
    const payload = {
      sku: datos.sku ?? null,
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      precio: datos.precio,
      descuento_porcentaje: datos.descuento_porcentaje ?? 0,
      imagen_url: datos.imagen_url ?? null,
      stock: datos.stock ?? 0,
    };

    const result = await this.db.excecuteNameQuery("crearProducto", payload);
    const nuevoProducto = result?.[0] || result;

    // 2. Asociar categorías en paralelo si se proporcionaron
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
    const payload = {
      id: datos.id,
      nombre: datos.nombre ?? null,
      descripcion: datos.descripcion ?? null,
      precio: datos.precio ?? null,
      descuento_porcentaje: datos.descuento_porcentaje ?? null,
      imagen_url: datos.imagen_url ?? null,
      stock: datos.stock ?? null,
      estado: datos.estado ?? null,
    };

    const result = await this.db.excecuteNameQuery(
      "actualizarProducto",
      payload,
    );
    return result?.[0];
  }

  async eliminarProducto(id: string): Promise<void> {
    await this.db.excecuteNameQuery("eliminarProducto", { id });
  }
}

export default new ProductRepository();
