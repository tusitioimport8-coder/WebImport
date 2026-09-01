import DB from "../components/DBComponent";
import {
  Usuario,
  CrearUsuarioInput as CrearUsuarioDTO,
  ActualizarUsuarioInput as ActualizarUsuarioDTO,
  ObtenerUsuarioDTO,
} from "../interfaces/usuario.interface";

class UserRepository {
  constructor(private readonly db = DB) {}

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
}

export default new UserRepository();
