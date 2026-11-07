import {
  Component,
  ElementRef,
  AfterViewInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services/auth';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;

  renderButton(
    parent: HTMLElement,
    options: {
      theme: string;
      size: string;
      text: string;
      shape: string;
      width: number;
    }
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

@Component({
  selector: 'app-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sesion.html',
  styleUrl: './sesion.less'
})
export class Sesion implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly googleClientId =
    '936498476946-b7us1qq6a3bt7a7fkeh3uscu51lssb1a.apps.googleusercontent.com';

  @ViewChild('googleButton')
  googleButton?: ElementRef<HTMLDivElement>;

  readonly modoRegistro = signal(false);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  nombre_completo = '';
  correo = '';
  password = '';
  telefono = '';

 ngAfterViewInit(): void {
  this.inicializarGoogle();
}

  private inicializarGoogle(intentos = 0): void {
    if (!window.google?.accounts?.id) {
      if (intentos < 20) {
        setTimeout(() => this.inicializarGoogle(intentos + 1), 250);
      } else {
        this.error.set('No se pudo cargar el inicio de sesión con Google.');
      }
      return;
    }

    window.google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: response => this.autenticarConGoogle(response)
    });

    if (this.googleButton?.nativeElement) {
      const container = this.googleButton.nativeElement;
      container.innerHTML = '';

      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 300
      });
    }
  }

  private autenticarConGoogle(
    response: GoogleCredentialResponse
  ): void {
    if (this.cargando()) return;

    if (!response.credential) {
      this.error.set('Google no proporcionó un token válido.');
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.authService.googleLogin(response.credential).subscribe({
      next: result => {
        if (!result.success) {
          this.error.set(
            result.message || 'No se pudo iniciar sesión con Google.'
          );
          this.cargando.set(false);
          return;
        }

        this.authService.checkSession().pipe(
          finalize(() => this.cargando.set(false))
        ).subscribe({
          next: session => {
            if (session.success && session.user) {
              this.router.navigate(['/inicio']);
            } else {
              this.error.set(
                'Google autenticó la cuenta, pero no se pudo verificar la sesión.'
              );
            }
          },
          error: err => {
            this.error.set(
              err.error?.message ||
              'No se pudo verificar la sesión del usuario.'
            );
          }
        });
      },
      error: err => {
        this.cargando.set(false);
        this.error.set(
          err.error?.message ||
          'Ocurrió un error al autenticar con Google.'
        );
      }
    });
  }

  cambiarModo(): void {
    this.modoRegistro.update(value => !value);
    this.mensaje.set('');
    this.error.set('');
    this.password = '';
  }

  enviar(): void {
    if (this.cargando()) return;

    this.mensaje.set('');
    this.error.set('');

    if (!this.correo.trim() || !this.password) {
      this.error.set('Introduce tu correo y contraseña.');
      return;
    }

    if (this.modoRegistro() && !this.nombre_completo.trim()) {
      this.error.set('Introduce tu nombre completo.');
      return;
    }

    this.cargando.set(true);

    const request = this.modoRegistro()
      ? this.authService.register({
          nombre_completo: this.nombre_completo.trim(),
          correo: this.correo.trim(),
          password: this.password,
          ...(this.telefono.trim()
            ? { telefono: this.telefono.trim() }
            : {})
        })
      : this.authService.login(
          this.correo.trim(),
          this.password
        );

    request.pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: response => {
        if (!response.success) {
          this.error.set(
            response.message || 'No se pudo completar la operación.'
          );
          return;
        }

        this.mensaje.set(response.message || 'Operación exitosa.');

        if (this.modoRegistro()) {
          this.modoRegistro.set(false);
          this.password = '';
        } else {
          this.router.navigate(['/inicio']);
        }
      },
      error: err => {
        this.error.set(
          err.error?.message ||
          'Ocurrió un error al conectar con el servidor.'
        );
      }
    });
  }
}
