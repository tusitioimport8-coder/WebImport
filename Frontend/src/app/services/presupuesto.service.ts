
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
export interface CrearPresupuestoRequest {
  usuario_id: string;
  total: number;
}

export interface Presupuesto {
  id: string;
  usuario_id: string;
  total: number;
  estado: string;
  tipo_documento: string;
}

export interface PresupuestoResponse {
  success: boolean;
  message?: string;
  data: Presupuesto;
}

@Injectable({
  providedIn: 'root',
})
export class PresupuestoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5000/api/presupuestos';

  crearPresupuesto(
    datos: CrearPresupuestoRequest,
  ): Observable<PresupuestoResponse> {
    return this.http.post<PresupuestoResponse>(
      this.apiUrl,
      datos,
      { withCredentials: true },
    );
  }
}
