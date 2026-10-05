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

  // Si tu método crearUsuario estándar no acepta google_id / avatar_url, puedes crear un método dedicado:
  async crearUsuarioGoogle(datos: {
    nombre_completo: string;
    correo: string;
    id_google: string;
    avatar_url?: string;
    rol?: string;
  }) {
    // Ejecuta la consulta "crearUsuarioGoogle" de query.json
    const result = await this.db.excecuteNameQuery("crearUsuarioGoogle", [
      datos.nombre_completo,
      datos.correo,
      datos.id_google,
      datos.avatar_url ?? null,
      datos.rol,
    ]);
    return result?.[0] || result;
  }

  async vincularGoogleId(
    id: string,
    googleId: string,
    avatarUrl: string | null,
  ) {
    // Ejecuta la consulta "vincularGoogleId" de query.json
    const result = await this.db.excecuteNameQuery("vincularGoogleId", {
      id,
      googleId,
      avatarUrl,
    });
    return result?.[0] || result;
  }
}

export default new UserRepository();
