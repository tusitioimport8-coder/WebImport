import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ProductPriceType =
  | 'Detal'
  | 'Mayor'
  | 'GranMayor';

export interface ApiProductPrice {
  id_precio: string;
  tipo_precio: ProductPriceType;

  /*
   * PostgreSQL NUMERIC puede llegar como string
   * dependiendo de la configuración de pg.
   */
  precio: number | string;
  precio_final?: number | string;
}

export interface ApiProduct {
  id: string;
  sku?: string;
  nombre: string;
  descripcion?: string;
  descuento_porcentaje: number | string;
  imagen_url?: string;
  stock: number;
  estado: boolean;
  creado_en: string;
  precios: ApiProductPrice[];
}

export interface ProductsResponse {
  success: boolean;
  data: ApiProduct[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5000/api/productos';

  getProducts(): Observable<ProductsResponse> {
  return this.http.get<ProductsResponse>(
    this.apiUrl,
  );
}
}