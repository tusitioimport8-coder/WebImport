import zod from "zod";

class Validator {
  constructor() {}

  async validateEmail(email: string) {
    const emailSchema = zod.string().email();
    return emailSchema.safeParse(email);
  }

  async validatePassword(password: string) {
    const passwordSchema = zod
      .string()
      .min(4, "La contraseña debe tener al menos 4 caracteres")
      .max(64, "La contraseña no puede exceder los 64 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");
    return passwordSchema.safeParse(password);
  }

  async validateUsername(username: string) {
    const usernameSchema = zod
      .string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
      .max(30, "El nombre de usuario no puede exceder los 30 caracteres")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "El nombre de usuario solo puede contener letras, números y guiones bajos",
      );
    return usernameSchema.safeParse(username);
  }

  async validateToken(token: string) {
    const tokenSchema = zod
      .string()
      .length(6, "El token debe tener exactamente 6 caracteres")
      .regex(
        /^[A-Z0-9]+$/,
        "El token solo puede contener letras mayúsculas y números",
      );
    return tokenSchema.safeParse(token);
  }

  async validateProducto(producto: unknown) {
    const productoSchema = zod.object({
      nombre: zod
        .string({ message: "El nombre es requerido" })
        .min(1, "El nombre no puede estar vacío"),
      precio: zod
        .number({ message: "El precio es requerido y debe ser un número" })
        .min(0, "El precio no puede ser negativo"),
      descuento_porcentaje: zod
        .number({ message: "El descuento debe ser un número" })
        .min(0, "El descuento no puede ser menor a 0")
        .max(100, "El descuento no puede ser mayor a 100")
        .optional(),
      stock: zod
        .number({ message: "El stock debe ser un número" })
        .int("El stock debe ser un número entero")
        .min(0, "El stock no puede ser negativo")
        .optional(),
      sku: zod.string().optional(),
      descripcion: zod.string().optional(),
      imagen_url: zod
        .string()
        .url("La URL de la imagen no es válida")
        .optional()
        .nullable(),
      categorias_ids: zod.array(zod.number()).optional(),
    });

    return productoSchema.safeParse(producto);
  }
}

export default new Validator();
