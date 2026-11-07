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
      .max(64, "La contraseña no puede exceder los 64 caracteres");
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
}

export default new Validator();
