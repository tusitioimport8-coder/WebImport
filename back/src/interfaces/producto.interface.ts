// 1. Representación exacta de las tablas en BD
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: string; // UUID
  sku?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  descuento_porcentaje: number;
  imagen_url?: string;
  stock: number;
  estado: boolean;
  creado_en: Date;
}

export interface ProductoImagen {
  id: number;
  producto_id: string;
  url: string;
  es_principal: boolean;
  creado_en: Date;
}

// 2. DTOs de Entrada y Salida

export interface CrearProductoDTO {
  sku?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  descuento_porcentaje?: number;
  imagen_url?: string;
  stock?: number;
  categorias_ids?: number[]; // Array de IDs de categorías a asociar (M:N)
}

export interface ActualizarProductoDTO {
  id: string;
  sku?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  descuento_porcentaje?: number;
  imagen_url?: string;
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
