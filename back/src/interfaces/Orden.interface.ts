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
  detalles: DatosEntregaDetalle;
}

export interface PagoPedidoInput {
  metodo: MetodoPago;
}

// Estructura de cada producto que viene desde el localStorage del Frontend
export interface ItemLocalStorageInput {
  producto_id: string;
  cantidad: number;
}

export interface DetallePedidoInput {
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
}

// DTO principal que recibe el controlador en el POST /api/pedidos
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
  datos_entrega: DatosEntregaDetalle;
  metodo_pago: MetodoPago;
  total: number;
  detalles: DetallePedidoInput[];
}

// ---------------------------------------------------------
// ESTRUCTURAS DE BASE DE DATOS (NEON / POSTGRESQL)
// ---------------------------------------------------------

// Representa una fila cruda de la tabla 'pedidos' en la BD
export interface PedidoDbRecord {
  id: string;
  id_usuario: string | null;
  nombre_completo: string;
  telefono: string;
  correo: string;
  sede: string;
  direccion_base: string | null;
  tipo_entrega: TipoEntrega;
  datos_entrega: string; // En BD se guarda como JSON string o JSONB
  metodo_pago: MetodoPago;
  total: number;
  estado: EstadoPedido;
  creado_en: string;
  actualizado_en?: string;
}

// Representa una fila cruda de la tabla 'detalles_pedido' en la BD
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

// Estructura del ítem formateado para respuestas al frontend
export interface ItemPedidoFormateado {
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Objeto completo que devuelve el repositorio al consultar un pedido con sus detalles
export interface PedidoConDetallesResponse extends Omit<
  PedidoDbRecord,
  "datos_entrega"
> {
  datos_entrega: DatosEntregaDetalle; // Ya parseado como objeto
  items: ItemPedidoFormateado[];
}

export interface ProductoDbRecord {
  id: string;
  nombre: string;
  precio_detal: number;
  precio_mayor: number;
  precio_gran_mayor: number;
  descuento_porcentaje?: number;
}
