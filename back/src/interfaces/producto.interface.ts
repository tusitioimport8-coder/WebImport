// 1. Representación exacta de las tablas en BD
export type tipo_precio = "detal_usd" | "detal_bs" | "Mayor" | "GranMayor";
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface PrecioProducto {
  id_precio: string; // UUID
  id_producto: string; // UUID
  tipo_precio: tipo_precio;
  precio: number;
  creado_en?: Date;
}

export interface Producto {
  id: string; // UUID
  nombre: string;
  descripcion?: string;
  descuento_porcentaje: number;
  imagen_url?: string;
  stock: number;
  estado: boolean;
  creado_en: Date;
  precios?: PrecioProducto[]; // <-- Lista de los 3 precios en lugar de un precio único
}

export interface ProductoImagen {
  id: number;
  producto_id: string;
  url: string;
  es_principal: boolean;
  creado_en: Date;
}

// 2. DTOs de Entrada y Salida

export interface PrecioInputDTO {
  tipo_precio: tipo_precio;
  precio: number;
}
export interface CrearProductoDTO {
  nombre: string;
  descripcion?: string;
  precios: PrecioInputDTO[]; // Exiges los precios (ej. Detal, Mayor, GranMayor)
  descuento_porcentaje?: number;
  imagen_url?: string | null;
  video_url?: string | null;
  stock?: number;
  categorias_ids?: number[];
}

export interface ActualizarProductoDTO {
  id: string;
  nombre?: string;
  descripcion?: string;
  precios?: PrecioInputDTO[];
  descuento_porcentaje?: number;
  imagen_url?: string | null;
  video_url?: string;
  stock?: number;
  estado?: boolean;
}

export interface AgregarImagenDTO {
  producto_id: string;
  url: string;
  es_principal?: boolean;
}

// DTO enriquecido para respuestas completas
export interface ProductoConDetallesDTO extends Producto {
  precio_final: number; // Calculado considerando el descuento
  categorias?: Categoria[];
  galeria?: ProductoImagen[];
}
