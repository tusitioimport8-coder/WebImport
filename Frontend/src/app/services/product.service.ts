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

export interface ApiProductCategory {
  id: number;
  nombre: string;
  descripcion: string;
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

  categorias?: ApiProductCategory[];
}

export interface ProductsResponse {
  success: boolean;
  data: ApiProduct[];
}

export interface ProductDetailResponse {
  success: boolean;
  data: ApiProduct;
}

export interface ProductPayload {
  nombre: string;
  descripcion: string;
  imagen_url: string;
  stock: number;
  precios: {
    tipo_precio: ProductPriceType;
    precio: number;
  }[];
  categorias_ids?: number[];
}

export interface ProductMutationResponse {
  success: boolean;
  message?: string;
  data: ApiProduct;
}

export interface ProductUploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
  };
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

  getProductById(id: string): Observable<ProductDetailResponse> {
    return this.http.get<ProductDetailResponse>(
      `${this.apiUrl}/${id}`,
    );
  }
createProduct(
  payload: ProductPayload
): Observable<ProductMutationResponse> {
  return this.http.post<ProductMutationResponse>(
    this.apiUrl,
    payload,
    { withCredentials: true }
  );
}
updateProduct(
  id: string,
  payload: Partial<ProductPayload>
): Observable<ProductMutationResponse> {
  return this.http.put<ProductMutationResponse>(
    `${this.apiUrl}/${id}`,
    payload,
    { withCredentials: true }
  );
}
getProductUploadUrl(
  file: File
): Observable<ProductUploadUrlResponse> {
  return this.http.post<ProductUploadUrlResponse>(
    `${this.apiUrl}/upload-url`,
    {
      nombreArchivo: file.name,
      tipoMime: file.type,
     destino: 'productos'
    },
    { withCredentials: true }
  );
}

uploadProductImage(
  uploadUrl: string,
  file: File
): Observable<unknown> {
  return this.http.put(
    uploadUrl,
    file,
    {
      headers: {
        'Content-Type': file.type
      },
      responseType: 'text'
    }
  );
}
}