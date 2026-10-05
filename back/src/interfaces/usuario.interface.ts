// 1. Representación exacta de la tabla en BD (para el Repository)
export type RolUsuario = "admin" | "cliente";

export interface Usuario {
  id: string; // UUID de PostgreSQL
  id_google?: string; // ID de Google (opcional)
  nombre_completo: string;
  correo: string;
  telefono?: string;
  password_hash: string;
  rol: RolUsuario;
  fecha_creacion: Date;
}

// 2. DTOs e Interfaces de Entrada / Salida

// DTO para la creación de usuario (Registro)
export interface CrearUsuarioInput {
  nombre_completo: string;
  correo: string;
  telefono?: string;
  password_hash: string;
  rol?: RolUsuario;
}

// DTO para actualizar el perfil del usuario
export interface ActualizarUsuarioInput {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono?: string;
}

// Respuesta limpia para consultas (omite datos sensibles como password_hash)
export interface ObtenerUsuarioDTO {
  id: string;
  nombre_completo: string;
  correo: string;
  password_hash: string;
  telefono?: string;
  rol: RolUsuario;
  fecha_creacion: Date;
}
