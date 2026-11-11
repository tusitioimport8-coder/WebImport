export type EstadoPresupuesto = "proceso" | "vendido" | "cancelado";

export interface PresupuestoDetalleInput {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  tipo_precio: string;
}

export interface PresupuestoInput {
  nombre_cliente: string;
  telefono_cliente?: string;
  descuento?: number;
  total: number;
  detalles: PresupuestoDetalleInput[];
}
