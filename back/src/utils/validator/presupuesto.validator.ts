import { z } from "zod";

export const presupuestoDetalleSchema = z.object({
  producto_id: z.string().uuid("El ID del producto debe ser un UUID válido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.number().positive().optional(),
  tipo_precio: z.enum(["detal_usd", "detal_bs", "Mayor", "GranMayor"]),
});

export const crearPresupuestoSchema = z.object({
  id: z.string().uuid("El ID debe ser un UUID válido").optional(),
  nombre_cliente: z.string().min(2, "El nombre del cliente es requerido"),
  telefono_cliente: z.string().optional(),
  descuento: z.number().min(0).max(100).optional(),
  total: z.number().optional(),
  detalles: z
    .array(presupuestoDetalleSchema)
    .min(1, "El presupuesto debe incluir al menos un producto"),
});

export const actualizarEstadoPresupuestoSchema = z.object({
  estado: z.enum(["proceso", "vendido", "cancelado"], {
    error: () => ({
      message: "Estado inválido. Debe ser: proceso, vendido o cancelado",
    }),
  }),
});

export const editarPresupuestoSchema = z.object({
  nombre_cliente: z.string().min(2).optional(),
  telefono_cliente: z.string().optional(),
  descuento: z.number().min(0).max(100).optional(),
  total: z.number().positive().optional(),
  estado: z.enum(["proceso", "vendido", "cancelado"]).optional(),
  detalles: z
    .array(
      z.object({
        producto_id: z.string().min(1),
        cantidad: z.number().positive(),
        precio_unitario: z.number().nonnegative().optional(),
        tipo_precio: z.enum(["detal_usd", "detal_bs", "Mayor", "GranMayor"]),
      }),
    )
    .min(1)
    .optional(),
});
