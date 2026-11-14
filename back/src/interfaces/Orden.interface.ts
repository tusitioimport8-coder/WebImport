export type TipoEntrega = "tienda" | "agencia" | "domicilio";

export type MetodoPago =
  | "binance"
  | "pago_movil"
  | "transferencia"
  | "punto_venta"
  | "efectivo";

export type EstadoPedido =
  | "pendiente"
  | "procesando"
  | "completado"
  | "cancelado";

export type TipoPrecio = "detal_usd" | "detal_bs" | "Mayor" | "GranMayor";

// ---------------------------------------------------------
// DATOS DEL CLIENTE Y FORMULARIO (PASOS 1, 2 Y 3)
// ---------------------------------------------------------

export interface ContactoPedidoInput {
  nombre_completo: string;
  telefono: string;
  correo: string;
  sede: string;
  direccion_base?: string;
}

export interface DatosEntregaDetalle {
  nombre_persona_retira?: string;
  cedula?: string;
  telefono_contacto?: string;
  direccion_exacta?: string;
  agencia_destino?: string;
}

export interface EntregaPedidoInput {
  tipo: TipoEntrega;
  datos_entrega: string;
}

export interface PagoPedidoInput {
  metodo: MetodoPago;
}

export interface ItemLocalStorageInput {
  producto_id: string;
  cantidad: number;
}

export interface DetallePedidoInput {
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CrearPedidoRequestDTO {
  contacto: ContactoPedidoInput;
  entrega: EntregaPedidoInput;
  pago: PagoPedidoInput;
  tipo_documento: "pedido" | "presupuesto";
  items: ItemLocalStorageInput[];
}

export interface GuardarPedidoInput {
  id_usuario: string | null;
  nombre_completo: string;
  telefono: string;
  correo: string;
  sede: string;
  direccion_base?: string | null;
  tipo_entrega: TipoEntrega;
  datos_entrega: string;
  metodo_pago: MetodoPago;
  total: number;
  detalles: DetallePedidoInput[];
  tipo_documento: "pedido" | "presupuesto";
}

export interface PedidoDbRecord {
  id: string;
  id_usuario: string | null;
  nombre_completo: string;
  telefono: string;
  correo: string;
  sede: string;
  direccion_base: string | null;
  tipo_entrega: TipoEntrega;
  datos_entrega: string;
  metodo_pago: MetodoPago;
  total: number;
  estado: EstadoPedido;
  creado_en: string;
  actualizado_en?: string;
}

export interface DetallePedidoDbRecord {
  id: string;
  id_pedido: string;
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
}

export interface PedidoCreadoDbRecord {
  id: string;
  creado_en: string;
}

export interface PedidoListadoDbRecord extends Pick<
  PedidoDbRecord,
  | "id"
  | "nombre_completo"
  | "telefono"
  | "correo"
  | "sede"
  | "tipo_entrega"
  | "metodo_pago"
  | "total"
  | "estado"
  | "creado_en"
> {}

export interface ItemPedidoFormateado {
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PrecioProductoItemDb {
  id_precio: string;
  tipo_precio: TipoPrecio;
  precio: number;
  precio_final: number;
}

export interface ProductoDbRecord {
  id: string;
  nombre: string;
  descripcion?: string | null;
  descuento_porcentaje?: string | number;
  imagen_url?: string | null;
  video_url?: string | null;
  stock: number;
  estado: boolean;
  creado_en: string;
  precios: PrecioProductoItemDb[];
}

export interface PedidoConDetallesResponse {
  id: string;
  id_usuario: string | null;
  nombre_completo: string;
  telefono: string;
  correo: string;
  sede: string;
  direccion_base: string | null;
  tipo_entrega: TipoEntrega;
  datos_entrega: DatosEntregaDetalle;
  metodo_pago: MetodoPago;
  total: number;
  estado: EstadoPedido;
  creado_en: string;
  actualizado_en?: string;
  detalles: DetallePedidoDbRecord[];
  productos: ProductoDbRecord[];
}
