
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export type EstadoPresupuesto =
  | 'proceso'
  | 'vendido'
  | 'cancelado';

export interface DetallePresupuesto {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  tipo_precio: string;
}

export interface CrearPresupuestoRequest {
  id?: string;
  nombre_cliente: string;
  telefono_cliente?: string;
  descuento?: number;
  total: number;
  detalles: DetallePresupuesto[];
}

export interface Presupuesto {
  id: string;
  nombre_cliente: string;
  telefono_cliente?: string | null;
  descuento: number;
  total: number;
  detalles: DetallePresupuesto[];
  estado?: EstadoPresupuesto;
  usuario_id?: string;
  tipo_documento?: string;
}

export interface PresupuestoResponse {
  success: boolean;
  message?: string;
  data?: Presupuesto;
}

export interface PresupuestosResponse {
  success: boolean;
  message?: string;
  data: Presupuesto[];
}

export interface EliminarPresupuestoResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PresupuestoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl
    ? `${environment.apiUrl.replace(/\/+$/, '')}/api/presupuestos`
    : 'http://localhost:5000/api/presupuestos';

  // POST - Crear presupuesto
  crearPresupuesto(
    datos: CrearPresupuestoRequest
  ): Observable<PresupuestoResponse> {
    return this.http.post<PresupuestoResponse>(
      this.apiUrl,
      datos,
      { withCredentials: true }
    );
  }

  // GET - Listar presupuestos
  listarPresupuestos(): Observable<PresupuestosResponse> {
    return this.http.get<PresupuestosResponse>(
      this.apiUrl,
      { withCredentials: true }
    );
  }

  // GET - Obtener presupuesto por ID
  obtenerPresupuestoPorId(
    id: string
  ): Observable<PresupuestoResponse> {
    return this.http.get<PresupuestoResponse>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }

  // PATCH - Actualizar estado
  cambiarEstado(
    id: string,
    estado: EstadoPresupuesto
  ): Observable<PresupuestoResponse> {
    return this.http.patch<PresupuestoResponse>(
      `${this.apiUrl}/${encodeURIComponent(id)}/estado`,
      { estado },
      { withCredentials: true }
    );
  }

  // DELETE - Eliminar presupuesto
  eliminarPresupuesto(
    id: string
  ): Observable<EliminarPresupuestoResponse> {
    return this.http.delete<EliminarPresupuestoResponse>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }
}
