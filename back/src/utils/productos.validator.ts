import zod from "zod";

const precioSchema = zod.object({
  tipo_precio: zod.enum(["Detal", "Mayor", "GranMayor"]),
  precio: zod.number().min(0, "El precio debe ser un número positivo"),
});

export const crearProductoSchema = zod.object({
  sku: zod.string().optional(),
  nombre: zod.string().min(1, "El nombre es obligatorio"),
  descripcion: zod.string().optional(),
  descuento_porcentaje: zod.number().min(0).max(100).optional(),
  stock: zod.number().min(0).optional(),
  categorias_ids: zod.array(zod.number()).optional(),
});

class ProductosValidator {
  async validateCrearProducto(producto: unknown) {
    return crearProductoSchema.safeParse(producto);
  }

  async validateProducto(producto: unknown) {
    const productoSchema = zod.object({
      id: zod
        .string()
        .uuid({ message: "El formato del ID no es un UUID válido" }),
      nombre: zod
        .string({ message: "El nombre es requerido" })
        .min(1, "El nombre no puede estar vacío"),
      precios: zod
        .array(precioSchema)
        .min(1, "Debe incluir al menos un precio"),
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

  async validateActualizarProducto(producto: unknown) {
    const actualizarProductoSchema = zod.object({
      id: zod
        .string({ message: "El ID del producto es requerido" })
        .uuid({ message: "El formato del ID no es un UUID válido" }),
      nombre: zod.string().min(1, "El nombre no puede estar vacío").optional(),
      precio: zod.number().min(0, "El precio no puede ser negativo").optional(),
      descuento_porcentaje: zod.number().min(0).max(100).optional(),
      stock: zod.number().int().min(0).optional(),
      sku: zod.string().optional(),
      descripcion: zod.string().optional(),
      imagen_url: zod
        .string()
        .url({ message: "La URL de la imagen no es válida" })
        .optional()
        .nullable(),
      estado: zod.boolean().optional(),
    });

    return actualizarProductoSchema.safeParse(producto);
  }
}

export default new ProductosValidator();
