import zod from "zod";

const bannerImagenSchema = zod.object({
  objectKey: zod
    .string({ message: "La clave del objeto es requerida" })
    .min(1, "La clave del objeto no puede estar vacía"),

  publicUrl: zod
    .string()
    .url("La URL pública de la imagen no es válida")
    .optional(),
});

export const crearOActualizarBannerSchema = zod.object({
  identificador: zod
    .string({ message: "El identificador es requerido" })
    .trim()
    .min(1, "El identificador no puede estar vacío"),

  titulo: zod
    .string({ message: "El título es requerido" })
    .trim()
    .min(1, "El título no puede estar vacío"),

  imagenes: zod.array(bannerImagenSchema, {
    message: "El campo imagenes debe ser un arreglo",
  }),

  activo: zod.boolean({
    message: "El campo activo debe ser booleano",
  }),
});

class BannerValidator {
  async validateCrearOActualizarBanner(banner: unknown) {
    return crearOActualizarBannerSchema.safeParse(banner);
  }
}

export default new BannerValidator();
