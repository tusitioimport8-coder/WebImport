import { z } from "zod";

export const presupuestoDetalleSchema = z.object({
  producto_id: z.string().uuid("El ID del producto debe ser un UUID válido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.number().positive("El precio unitario debe ser mayor a 0"),
  tipo_precio: z.string().min(1, "El tipo de precio es requerido"),
});

export const crearPresupuestoSchema = z.object({
  id: z.string().uuid("El ID debe ser un UUID válido").optional(),
  nombre_cliente: z.string().min(2, "El nombre del cliente es requerido"),
  telefono_cliente: z.string().optional(),
  descuento: z.number().min(0, "El descuento no puede ser negativo").optional(),
  total: z.number().positive("El total debe ser mayor a 0"),
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
