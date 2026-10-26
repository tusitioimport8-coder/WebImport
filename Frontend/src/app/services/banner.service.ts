
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BannerImage {
  objectKey: string;
  publicUrl: string;
}

export interface Banner {
  id?: string;
  identificador: string;
  titulo: string;
  imagenes: BannerImage[];
  activo: boolean;
}

export interface BannerResponse {
  success: boolean;
  data: Banner;
}

export interface UploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private readonly http = inject(HttpClient);

  private readonly bannersUrl =
    'http://localhost:5000/api/banners';

  private readonly uploadUrl =
    'http://localhost:5000/api/productos/upload-url';

  // Carga pública: cualquier usuario puede ver los banners.
 getBanner(identificador: string): Observable<BannerResponse> {
  return this.http.get<BannerResponse>(
    `${this.bannersUrl}/${identificador}`,
    {
      withCredentials: true
    }
  );
}

  // Solicita una URL temporal para subir la imagen.
  requestUploadUrl(file: File): Observable<UploadUrlResponse> {
    return this.http.post<UploadUrlResponse>(
      this.uploadUrl,
      {
        nombreArchivo: file.name,
        tipoMime: file.type,
        destino: 'banners'
      },
      {
        withCredentials: true
      }
    );
  }

  // Sube el archivo directamente al almacenamiento.
  uploadImage(uploadUrl: string, file: File): Observable<unknown> {
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

  // Publica las imágenes para que todos puedan verlas.
saveBanner(
  identificador: string,
  imagenes: BannerImage[]
) {
  return this.http.post<BannerResponse>(
    this.bannersUrl,
    {
      identificador,
      titulo:
        identificador === 'home-principal'
          ? 'Promoción principal'
          : 'Promoción secundaria',
      imagenes,
      activo: true
    },
    { withCredentials: true }
  );
}
}
