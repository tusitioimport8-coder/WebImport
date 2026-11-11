import type { Request, Response } from "express";
import UserRepository from "../repositories/UserRepository.js";
import AdminValidator from "../utils/validator/AdminValidator.js";
import type { RolUsuario } from "../interfaces/usuario.interface.js";
// Conserva aquí la importación de ROLES_PERMITIDOS desde
// el archivo donde ya está definido en tu proyecto.
const ROLES_PERMITIDOS: RolUsuario[] = [
  "admin",
  "cliente",
  "F_ventas",
  "marketing",
];

type AdminRequest = Request & {
  user?: {
    id?: string;
  };
};

export class AdminController {
  constructor(private readonly userRepo = UserRepository) {}

  /**
   * GET /api/admin/usuarios
   * Lista los usuarios registrados.
   */
  async listarUsuarios(_req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await this.userRepo.obtenerTodosLosUsuarios();

      return res.status(200).json({
        success: true,
        data: usuarios,
      });
    } catch (error: unknown) {
      console.error("Error al listar usuarios:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno al obtener los usuarios",
      });
    }
  }

  /**
   * PATCH /api/admin/usuarios/:id/rol
   * Actualiza el rol de un usuario.
   */
  async actualizarRol(req: AdminRequest, res: Response): Promise<Response> {
    try {
      const validacionId = AdminValidator.validarId(req.params.id);

      if (!validacionId.success) {
        return res.status(400).json({
          success: false,
          message: "Identificador de usuario no válido",
          details: validacionId.error.flatten(),
        });
      }

      const validacionBody = AdminValidator.validarActualizacionRol(req.body);

      if (!validacionBody.success) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          details: validacionBody.error.flatten(),
        });
      }

      const { rol } = validacionBody.data;

      if (
        !ROLES_PERMITIDOS.includes(rol as (typeof ROLES_PERMITIDOS)[number])
      ) {
        return res.status(400).json({
          success: false,
          message: `Rol no válido. Los roles permitidos son: ${ROLES_PERMITIDOS.join(", ")}`,
        });
      }

      const id = validacionId.data;
      const idAdministrador = req.user?.id;

      // No se permite que el administrador se quite su propio rol.
      // Esto presupone que authMiddleware guarda el usuario en req.user.id.
      if (idAdministrador && idAdministrador === id && rol !== "ADMIN") {
        return res.status(400).json({
          success: false,
          message: "No puedes quitarte tu propio rol de administrador",
        });
      }

      const usuarioActualizado = await this.userRepo.actualizarRolUsuario(
        id,
        rol,
      );

      if (!usuarioActualizado) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Rol de usuario actualizado exitosamente",
        data: usuarioActualizado,
      });
    } catch (error: unknown) {
      console.error("Error al actualizar rol:", error);

      return res.status(500).json({
        success: false,
        message: "Error interno al actualizar el rol",
      });
    }
  }
}

export default new AdminController();
