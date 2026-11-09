import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  tipo: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  id_usuario?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl
    ? `${environment.apiUrl}api/auth`
    : 'http://localhost:5000/api/auth';

  readonly user = signal<AuthUser | null>(null);

  login(correo: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { correo, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success && response.user) {
            this.user.set(response.user);
          }
        }),
      );
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/google-auth`, { idToken }, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success && response.user) {
            this.user.set(response.user);
          }
        }),
      );
  }

  register(data: {
    nombre_completo: string;
    correo: string;
    password: string;
    telefono?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data, { withCredentials: true });
  }

  logout(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success) {
            this.user.set(null);
          }
        }),
      );
  }
  checkSession(): Observable<AuthResponse> {
    return this.http
      .get<AuthResponse>(`${this.apiUrl}/check-session`, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.user.set(response.success ? (response.user ?? null) : null);
        }),
        catchError(() => {
          this.user.set(null);

          return of({
            success: false,
            message: 'Usuario no autenticado',
          });
        }),
      );
  }
}
