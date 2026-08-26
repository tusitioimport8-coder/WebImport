// src/services/Session.ts
import { Request, Response } from "express";
import { SessionUser } from "../types/express-session"; // O tu carpeta de interfaces

export interface SessionObject {
  request: Request;
  response: Response;
}

class Session {
  async createSession(
    sessionObject: SessionObject,
    user: SessionUser[],
  ): Promise<void> {
    const currentUser = user[0];

    if (!currentUser) {
      sessionObject.response.status(400).json({
        success: false,
        message: "No se proporcionó información de usuario válida",
      });
      return;
    }

    // TypeScript YA RECONOCE session.user automáticamente aquí
    sessionObject.request.session.user = {
      id: currentUser.id,
      email: currentUser.email,
      nombre: currentUser.nombre,
      tipo: String(currentUser.tipo || "")
        .trim()
        .toUpperCase(),
    };

    sessionObject.response.json({
      success: true,
      message: "Se ha iniciado sesión correctamente",
      sid: sessionObject.request.sessionID,
      user: sessionObject.request.session.user,
    });
  }

  sessionExist(sessionObject: SessionObject): boolean {
    return Boolean(sessionObject.request.session.user);
  }

  destroySession(sessionObject: SessionObject): void {
    sessionObject.request.session.destroy((error: any) => {
      if (error) {
        sessionObject.response.status(500).json({
          success: false,
          message: "Error al cerrar sesión",
        });
        return;
      }

      sessionObject.response.json({
        success: true,
        message: "Sesión cerrada exitosamente",
      });
    });
  }
}

export default new Session();
