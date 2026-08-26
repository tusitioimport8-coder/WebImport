import DB from "../components/DBComponent";
import {
  Usuario,
  CrearUsuarioInput as CrearUsuarioDTO,
  ActualizarUsuarioInput as ActualizarUsuarioDTO,
  ObtenerUsuarioDTO,
} from "../interfaces/usuario.interface";
import {
  Producto,
  CrearProductoDTO,
  ActualizarProductoDTO,
  AgregarImagenDTO,
  ProductoConDetallesDTO,
  Categoria,
  ProductoImagen,
} from "../interfaces/producto.interface";

class UserRepository {
  constructor(private readonly db = new DB()) {}

  // ==========================================
  // METODOS DE USUARIOS (E-commerce)
  // ==========================================

  async getUsuarios(): Promise<ObtenerUsuarioDTO[]> {
    const result = await this.db.excecuteNameQuery("getUsuarios", {});
    return result || [];
  }

  async getUsuarioPorId(id: string): Promise<Usuario | undefined> {
    const result = await this.db.excecuteNameQuery("getUsuarioPorId", { id });
    return result?.[0];
  }

  async getUsuarioPorCorreo(correo: string): Promise<Usuario | undefined> {
    const result = await this.db.excecuteNameQuery("getUsuarioPorCorreo", {
      correo,
    });
    return result?.[0];
  }

  async crearUsuario(datos: CrearUsuarioDTO): Promise<{ id: string }> {
    const result = await this.db.excecuteNameQuery("crearUsuario", datos);
    return result?.[0] || result;
  }

  async actualizarUsuario(
    datos: ActualizarUsuarioDTO,
  ): Promise<ObtenerUsuarioDTO | undefined> {
    const result = await this.db.excecuteNameQuery("actualizarUsuario", datos);
    return result?.[0];
  }

  async actualizarPassword(id: string, password_hash: string): Promise<void> {
    await this.db.excecuteNameQuery("actualizarPassword", {
      id,
      password_hash,
    });
  }

  async eliminarUsuario(id: string): Promise<void> {
    await this.db.excecuteNameQuery("eliminarUsuario", { id });
  }

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
    const result = await this.db.excecuteNameQuery("crearProducto", datos);
    const nuevoProducto = result?.[0] || result;

    // Asociar categorías enviadas en el DTO
    if (datos.categorias_ids && datos.categorias_ids.length > 0) {
      for (const categoriaId of datos.categorias_ids) {
        await this.db.excecuteNameQuery("asociarCategoriaProducto", {
          producto_id: nuevoProducto.id,
          categoria_id: categoriaId,
        });
      }
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

  async eliminarProducto(id: string): Promise<void> {
    await this.db.excecuteNameQuery("eliminarProducto", { id });
  }
}

export default new UserRepository();
