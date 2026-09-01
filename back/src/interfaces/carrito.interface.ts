export type TipoPrecio = "Detal" | "Mayor" | "GranMayor";

export interface CarritoItemBase {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_detal: number;
}

export interface NotificacionProgreso {
  mensaje: string;
  nivel_actual: TipoPrecio;
  siguiente_nivel: TipoPrecio | null;
  progreso_porcentaje: number;
  faltante_unidades: number;
  faltante_monto: number;
}

export interface ResultadoRecalculoCarrito {
  carrito_id: string;
  nivel_actual: TipoPrecio;
  total_unidades: number;
  monto_base_detal: number;
  notificacion: NotificacionProgreso;
}

// Representa la fila cruda devuelta por 'obtenerProductosCarritoRaw'
export interface CarritoItemRaw {
  item_id: string;
  producto_id: string;
  nombre: string;
  imagen_url: string;
  descuento_porcentaje: number;
  cantidad: number;
  precio_detal: number;
  precio_mayor: number;
  precio_gran_mayor: number;
}

// Representa el ítem procesado que recibe el frontend
export interface CarritoItemFormateado {
  item_id: string;
  producto_id: string;
  nombre: string;
  imagen_url: string;
  cantidad: number;
  tipo_precio_aplicado: TipoPrecio;
  precio_unitario: number;
  descuento_porcentaje: number;
  precio_final: number;
  subtotal: number;
}

export interface CarritoResumen {
  nivel_aplicado: TipoPrecio;
  total_unidades: number;
  total_pagar: number;
}

export interface CarritoResponseData {
  carrito_id: string;
  resumen: CarritoResumen;
  notificacion: NotificacionProgreso;
  items: CarritoItemFormateado[];
}

export interface CarritoItemInput {
  carrito_id: string;
  producto_id: string;
  cantidad: number;
}

export interface CarritoItemUpdateInput {
  carrito_id: string;
  producto_id: string;
  cantidad: number;
}
