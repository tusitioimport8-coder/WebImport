import "express-session";

// Interfaz para el usuario guardado en la sesión
export interface SessionUser {
  id: number | string;
  email: string;
  nombre: string;
  tipo: string;
}

// Extendemos el tipo SessionData nativo de express-session
declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
