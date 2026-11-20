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
    password_hash: string;
    avatar_url?: string;
    rol?: string;
  }) {
    // Ejecuta la consulta "crearUsuarioGoogle" de query.json
    const result = await this.db.excecuteNameQuery("crearUsuarioGoogle", {
      nombre_completo: datos.nombre_completo,
      correo: datos.correo,
      password_hash: datos.password_hash,
      rol: datos.rol || "cliente",
      id_google: datos.id_google,
      avatar_url: datos.avatar_url ?? null,
    });

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

  async actualizarPasswordYLimpiarToken(id: string, password_hash: string) {
    const result = await this.db.excecuteNameQuery("actualizarPassword", {
      password_hash,
      id,
    });
    return result?.[0] || result;
  }

  async guardarResetToken(
    id: string,
    reset_token: string,
    reset_token_expires: Date,
  ) {
    const result = await this.db.excecuteNameQuery("guardarResetToken", {
      usuario_id: id,
      token: reset_token,
      expires_at: reset_token_expires,
    });
    return result?.[0] || result;
  }
  /**
   * Obtiene todos los usuarios registrados en el sistema
   */
  async obtenerTodosLosUsuarios(): Promise<Usuario[]> {
    const result = await this.db.excecuteNameQuery<Usuario>(
      "obtenerTodosLosUsuarios",
      {},
    );
    return result || [];
  }

  /**
   * Actualiza el rol de un usuario por su ID
   */
  async actualizarRolUsuario(id: string, rol: string): Promise<Usuario | null> {
    const result = await this.db.excecuteNameQuery<Usuario>(
      "actualizarRolUsuario",
      {
        rol,
        id,
      },
    );
    return result?.[0] || null;
  }

  async buscarResetTokenValido(usuario_id: string, token: string) {
    const result = await this.db.excecuteNameQuery("buscarResetTokenValido", {
      usuario_id,
      token,
    });
    return result?.[0] || null;
  }

  async marcarResetTokenUsado(id: string) {
    const result = await this.db.excecuteNameQuery("marcarResetTokenUsado", {
      id,
    });
    return result?.[0] || null;
  }
}

export default new UserRepository();
