import { Request, Response } from "express";
import Session from "../components/session.js";
import Validator from "../utils/validator.js";
import LinkRepository from "./Repository.js";
import Bcrypt from "../utils/bcrypt.js";
import {
  Usuario,
  CrearUsuarioInput as CrearUsuarioDTO,
  ActualizarUsuarioInput as ActualizarUsuarioDTO,
} from "../interfaces/usuario.interface.js";
import { SessionUser } from "../types/express-session.js";

class Auth {
  constructor(
    private readonly session = Session,
    private readonly validator = Validator,
    private readonly repository = LinkRepository,
    private readonly bcrypt = Bcrypt,
  ) {}

  /**
   * Extrae el ID del usuario desde la sesión, body, query o params.
   */
  async resolveUserId(req: Request): Promise<string | null> {
    const candidate =
      req.session?.user?.id ??
      req.body?.id_usuario ??
      req.body?.usuarioId ??
      req.query?.usuarioId ??
      req.params?.usuarioId;

    return candidate ? String(candidate) : null;
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, correo, password, contrasena } = req.body;
      const normalizedEmail = (correo ?? email ?? "").trim();
      const rawPassword = password ?? contrasena;

      if (!normalizedEmail || !rawPassword) {
        return res.status(400).json({
          success: false,
          message: "Correo y contraseña son requeridos",
        });
      }

      if (typeof rawPassword !== "string" || rawPassword.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Contraseña requerida",
        });
      }

      const emailValidation =
        await this.validator.validateEmail(normalizedEmail);
      if (!emailValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico inválido",
        });
      }

      // 1. Obtener usuario de la base de datos por correo
      const userBD: Usuario | undefined =
        await this.repository.getUsuarioPorCorreo(normalizedEmail);

      if (!userBD) {
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // 2. Comparar la contraseña encriptada
      const valid = await this.bcrypt.compare(
        rawPassword,
        userBD.password_hash,
      );

      if (!valid) {
        return res.status(401).json({
          success: false,
          message: "Contraseña incorrecta",
        });
      }

      // 3. Formatear al tipo SessionUser exacto
      const sessionUser: SessionUser = {
        id: userBD.id,
        email: userBD.correo,
        nombre: userBD.nombre_completo,
        tipo: userBD.rol,
      };

      console.log(
        "[Auth] Usuario autenticado:",
        sessionUser.email,
        "ID:",
        sessionUser.id,
      );

      // 4. Delegar la creación de sesión a Session.ts
      await this.session.createSession({ request: req, response: res }, [
        sessionUser,
      ]);

      return res;
    } catch (error) {
      if (res.headersSent) {
        return res;
      }
      return res.status(500).json({
        success: false,
        message: "Error interno en el servidor durante el inicio de sesión",
      });
    }
  }

  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { nombre_completo, correo, password, contrasena, telefono, rol } =
        req.body;

      const normalizedEmail = (correo ?? "").trim();
      const rawPassword = password ?? contrasena;

      if (!nombre_completo || !normalizedEmail || !rawPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Los campos nombre_completo, correo y contraseña son obligatorios",
        });
      }

      // Validaciones básicas de negocio
      const emailValidation =
        await this.validator.validateEmail(normalizedEmail);
      if (!emailValidation.success) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico inválido",
        });
      }

      const passwordValidation =
        await this.validator.validatePassword(rawPassword);
      if (!passwordValidation.success) {
        return res.status(400).json({
          success: false,
          message:
            "La contraseña no cumple con los requisitos mínimos de seguridad",
        });
      }

      // Verificar si el correo ya está registrado
      const existingUserByEmail =
        await this.repository.getUsuarioPorCorreo(normalizedEmail);
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: "El correo electrónico ya está registrado",
        });
      }

      // Encriptar contraseña
      const hashedPassword = await this.bcrypt.hash(rawPassword);

      // Estructurar el DTO de creación alineado con usuarios.interface.ts
      const newUserPayload: CrearUsuarioDTO = {
        nombre_completo,
        correo: normalizedEmail,
        password_hash: hashedPassword,
        telefono: telefono ?? undefined,
        rol: rol ?? "cliente",
      };

      const result = await this.repository.crearUsuario(newUserPayload);

      return res.status(201).json({
        success: true,
        message: "Usuario creado correctamente",
        id_usuario: result.id,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Ocurrió un error al registrar el usuario",
      });
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    this.session.destroySession({ request: req, response: res });
    return res;
  }

  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = await this.resolveUserId(req);

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido o ausente",
        });
      }

      await this.repository.eliminarUsuario(usuarioId);

      if (req.session) {
        req.session.destroy(() => {});
      }

      return res.json({
        success: true,
        message: "La cuenta de usuario ha sido eliminada exitosamente",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudo eliminar la cuenta de usuario",
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = await this.resolveUserId(req);

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
      }

      const { nombre_completo, correo, telefono, newPassword } = req.body;

      if (!nombre_completo && !correo && !telefono && !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un campo para actualizar",
        });
      }

      if (newPassword) {
        const passValidation =
          await this.validator.validatePassword(newPassword);
        if (!passValidation.success) {
          return res.status(400).json({
            success: false,
            message: "Contraseña no válida",
          });
        }

        const hashed = await this.bcrypt.hash(newPassword);
        await this.repository.actualizarPassword(usuarioId, hashed);
      }

      const updateData: ActualizarUsuarioDTO = {
        id: usuarioId,
        nombre_completo: nombre_completo ?? undefined,
        correo: correo ?? undefined,
        telefono: telefono ?? undefined,
      };

      await this.repository.actualizarUsuario(updateData);

      return res.json({
        success: true,
        message: "Información de usuario actualizada correctamente",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudo actualizar la cuenta del usuario",
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const users = await this.repository.getUsuarios();
      const safeUsers = users.map(({ password_hash, ...rest }) => rest);

      return res.json({
        success: true,
        data: safeUsers,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudieron obtener los usuarios",
      });
    }
  }

  async checkSession(req: Request, res: Response): Promise<Response> {
    const exists = this.session.sessionExist({ request: req, response: res });
    if (exists && req.session?.user) {
      return res.json({
        success: true,
        message: "Usuario autenticado",
        user: req.session.user,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Usuario no autenticado",
    });
  }
}

export default new Auth();
