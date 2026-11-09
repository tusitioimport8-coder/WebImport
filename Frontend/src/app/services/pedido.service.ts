import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
export interface CrearPedidoRequest {
  contacto: {
    nombre_completo: string;
    telefono: string;
    correo: string;
    sede: string;
    direccion_base: string;
  };
  entrega: {
    tipo: string;
    detalles: string;
  };
  pago: {
    metodo: string;
  };
  items: {
    producto_id: string;
    cantidad: number;
  }[];
}

export interface CrearPedidoResponse {
  success: boolean;
  message: string;
  data: {
    pedido: {
      id: string;
    };
    whatsappUrl: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl
    ? `${environment.apiUrl}api/pedidos`
    : 'http://localhost:5000/api/pedidos';

  crearPedido(pedido: CrearPedidoRequest): Observable<CrearPedidoResponse> {
    return this.http.post<CrearPedidoResponse>(this.apiUrl, pedido, { withCredentials: true });
  }
}
