import { z } from "zod";

const idSchema = z
  .string()
  .trim()
  .min(1, "El identificador es obligatorio")
  .max(128, "El identificador es demasiado largo");

const actualizarRolSchema = z
  .object({
    rol: z
      .string()
      .trim()
      .min(1, "El rol es obligatorio")
      .max(50, "El rol es demasiado largo"),
  })
  .strict();

class AdminValidator {
  static validarId(id: unknown) {
    return idSchema.safeParse(id);
  }

  static validarActualizacionRol(body: unknown) {
    return actualizarRolSchema.safeParse(body);
  }
}

export default AdminValidator;
