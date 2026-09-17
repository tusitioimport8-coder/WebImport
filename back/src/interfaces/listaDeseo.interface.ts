export interface IListaDeseos {
  id: string;
  usuario_id: string;
  nombre: string;
  token_compartir: string;
  creado_en: Date;
}

export interface IWishlistItemPublico {
  item_id: string;
  producto_id: string;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  cantidad_deseada: number;
  comprado: boolean;
  comprado_por_nombre: string | null;
}

export interface IListaDeseosPublica {
  lista_id: string;
  nombre: string;
  token_compartir: string;
  usuario_id: string;
  items: IWishlistItemPublico[];
}

export interface IAgregarItemDTO {
  producto_id: string;
  cantidad_deseada?: number;
}

export interface IMarcarCompradoDTO {
  comprado_por_nombre: string;
}
