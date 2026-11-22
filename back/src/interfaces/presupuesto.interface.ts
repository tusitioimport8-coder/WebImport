export type EstadoPresupuesto = "proceso" | "vendido" | "cancelado";
export type TipoPrecioPresupuesto =
  | "detal_usd"
  | "detal_bs"
  | "Mayor"
  | "GranMayor";

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

export interface EditarPresupuestoDetalleInput {
  producto_id: string;
  cantidad: number;
  precio_unitario?: number;
  tipo_precio?: TipoPrecioPresupuesto;
}

export interface IPresupuesto {
  id: string;
  nombre_cliente: string;
  telefono_cliente: string | null;
  telefono?: string;
  correo?: string;
  usuario_id?: string | null;
  descuento: number;
  total: number;
  estado: EstadoPresupuesto;
  creado_en?: Date;
  detalles?: PresupuestoDetalleItem[];
}

export interface EditarPresupuestoPayload {
  id: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  descuento?: number;
  total?: number;
  estado?: EstadoPresupuesto;
  detalles?: EditarPresupuestoDetalleInput[];
}

export interface PresupuestoDetalleItem {
  id_detalle: string;
  presupuesto_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  tipo_precio: TipoPrecioPresupuesto;
}

export interface PresupuestoEditado {
  id: string;
  nombre_cliente: string;
  telefono_cliente: string | null;
  descuento: number;
  total: number;
  estado: EstadoPresupuesto;
  detalles?: PresupuestoDetalleItem[];
}
