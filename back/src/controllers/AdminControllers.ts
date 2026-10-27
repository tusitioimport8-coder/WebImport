import { Request, Response } from "express";
import UserRepository from "../repositories/UserRepository.js";
import { RolUsuario } from "../interfaces/usuario.interface.js";
import { PedidoConDetallesResponse } from "../interfaces/Orden.interface.js";

const ROLES_PERMITIDOS: RolUsuario[] = [
  "admin",
  "cliente",
  "F_ventas",
  "marketing",
];

export class AdminController {
  constructor(private readonly userRepo = UserRepository) {}

  /**
   * GET /api/admin/usuarios
   * Lista todos los usuarios registrados
   */
  async listarUsuarios(req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await this.userRepo.obtenerTodosLosUsuarios();
      return res.status(200).json({
        success: true,
        data: usuarios,
      });
    } catch (error: any) {
      console.error("Error al listar usuarios:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener los usuarios",
        details: error.message,
      });
    }
  }

  /**
   * PATCH /api/admin/usuarios/:id/rol
   * Actualiza el rol de un usuario
   */
  async actualizarRol(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { rol } = req.body;

      if (!rol || !ROLES_PERMITIDOS.includes(rol)) {
        return res.status(400).json({
          success: false,
          message: `Rol no válido. Los roles permitidos son: ${ROLES_PERMITIDOS.join(", ")}`,
        });
      }

      const usuarioActualizado = await this.userRepo.actualizarRolUsuario(
        id.toString(),
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
    } catch (error: any) {
      console.error("Error al actualizar rol:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al actualizar el rol",
        details: error.message,
      });
    }
  }

  /**
   * GET /api/admin/pedidos-locales
   * Obtiene todos los pedidos locales
   */

  async getpedidosLocales(req: Request, res: Response): Promise<Response> {
    try {
      // Lógica para obtener los pedidos locales
      const pedidosLocales: PedidoConDetallesResponse[] = []; // Aquí deberías llamar a tu repositorio o servicio para obtener los pedidos locales

      return res.status(200).json({
        success: true,
        data: pedidosLocales,
      });
    } catch (error: any) {
      console.error("Error al obtener pedidos locales:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener los pedidos locales",
        details: error.message,
      });
    }
  }
}

export default new AdminController();
