
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiUser {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: string;
}

export interface UsersResponse {
  success: boolean;
  data: ApiUser[];
}

export interface UserActionResponse {
  success: boolean;
  message: string;
}

export interface UpdateUserPayload {
  nombre_completo?: string;
  correo?: string;
  telefono?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  // Ajustar al prefijo real de las rutas de usuarios.
  private readonly apiUrl =
    'http://localhost:5000/api/usuarios';

  getAllUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(
      this.apiUrl,
      { withCredentials: true }
    );
  }

  updateUser(
    usuarioId: string,
    payload: UpdateUserPayload
  ): Observable<UserActionResponse> {
    return this.http.patch<UserActionResponse>(
      `${this.apiUrl}/${usuarioId}`,
      payload,
      { withCredentials: true }
    );
  }

  deleteUser(
    usuarioId: string
  ): Observable<UserActionResponse> {
    return this.http.delete<UserActionResponse>(
      `${this.apiUrl}/${usuarioId}`,
      { withCredentials: true }
    );
  }
}
