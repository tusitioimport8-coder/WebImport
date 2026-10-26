export interface ImagenBanner {
  publicUrl: string;
  objectKey: string;
}

export interface BannerDbRecord {
  id: number;
  identificador: string;
  titulo?: string;
  imagenes: ImagenBanner[];
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface GuardarBannerInput {
  identificador: string;
  titulo?: string;
  imagenes: ImagenBanner[];
  activo?: boolean;
}
