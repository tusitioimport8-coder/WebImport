import DB from "../components/DBComponent";
import {
  Categoria,
  CrearCategoria,
  ActualizarCategoria,
  EliminarCategoria,
} from "../interfaces/categoria.interface";

class CategoriaRepository {
  constructor(private readonly db = DB) {}

  async obtenerCategorias(): Promise<Categoria[]> {
    const result = await this.db.excecuteNameQuery("obtenerCategorias", {});
    return result || [];
  }

  async obtenerCategoriaPorId(id: number): Promise<Categoria | null> {
    const result = await this.db.excecuteNameQuery("obtenerCategoriaPorId", {
      id,
    });
    return result?.[0] || null;
  }

  async crearCategoria(data: CrearCategoria): Promise<Categoria> {
    const result = await this.db.excecuteNameQuery("crearCategoria", data);
    return result?.[0] || null;
  }

  async actualizarCategoria(
    id: number,
    data: ActualizarCategoria,
  ): Promise<Categoria | null> {
    const result = await this.db.excecuteNameQuery("actualizarCategoria", {
      id,
      ...data,
    });
    return result?.[0] || null;
  }

  async eliminarCategoria(id: number): Promise<boolean> {
    const result = await this.db.excecuteNameQuery("eliminarCategoria", { id });
    if (!result || result.length === 0) {
      return false;
    }
    return result[0].success === true;
  }
}

export default new CategoriaRepository();
