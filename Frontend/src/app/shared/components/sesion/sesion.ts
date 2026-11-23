

import {
  Component,
  ElementRef,
  AfterViewInit,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';


import { BannerService } from '../../../services/banner.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { finalize, switchMap } from 'rxjs';
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
export class Sesion implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);


private readonly bannerService = inject(BannerService);

readonly logoUrl = signal('/images/logo.png');
readonly uploadingLogo = signal(false);

readonly canEditLogo = computed(() => {
  const rol = this.authService.user()?.tipo?.trim().toUpperCase();

  return rol === 'ADMIN' || rol === 'MARKETING';
});

ngOnInit(): void {
  this.loadLogo();
}

loadLogo(): void {
  this.bannerService.getBanner('home-logo').subscribe({
    next: response => {
      const imagen = response.data?.activo
        ? response.data.imagenes?.[0]
        : null;

      if (imagen?.publicUrl) {
        this.logoUrl.set(imagen.publicUrl);
      }
    },
    error: error => {
      if (error.status !== 404) {
        console.error('Error cargando logo de sesión:', error);
      }
    }
  });
}

onLogoChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file || !this.canEditLogo() || this.uploadingLogo()) {
    return;
  }
const tiposPermitidos = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml'
];

if (!tiposPermitidos.includes(file.type)) {
  alert('Selecciona una imagen PNG, JPG, WEBP o SVG.');
  return;
}
  this.uploadingLogo.set(true);

  this.bannerService.requestUploadUrl(file).pipe(
    switchMap(response => {
      if (!response.success || !response.data) {
        throw new Error('No se pudo preparar la subida del logo.');
      }

      const { uploadUrl, publicUrl, objectKey } = response.data;

      return this.bannerService.uploadImage(uploadUrl, file).pipe(
        switchMap(() =>
          this.bannerService.saveBanner('home-logo', [
            { objectKey, publicUrl }
          ])
        )
      );
    }),
    finalize(() => this.uploadingLogo.set(false))
  ).subscribe({
    next: response => {
      if (!response.success) {
        alert('No se pudo guardar el nuevo logo.');
        return;
      }

      const nuevaUrl = response.data?.imagenes?.[0]?.publicUrl;

      if (nuevaUrl) {
        this.logoUrl.set(nuevaUrl);
      } else {
        this.loadLogo();
      }
    },
    error: error => {
      console.error('Error subiendo logo de sesión:', error);
      alert('No se pudo actualizar el logo.');
    }
  });
}


 private readonly googleClientId = environment.googleClientId;
  @ViewChild('googleButton')
  googleButton?: ElementRef<HTMLDivElement>;

  readonly modoRegistro = signal(false);
  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  // RECUPERACIÓN DE CONTRASEÑA
  readonly recuperandoPassword = signal(false);
  readonly codigoEnviado = signal(false);

  nombre_completo = '';
  correo = '';
  password = '';
  telefono = '';

  codigoRecuperacion = '';
  nuevaPassword = '';

  ngAfterViewInit(): void {
    this.inicializarGoogle();
  }

  private inicializarGoogle(intentos = 0): void {
    if (!window.google?.accounts?.id) {
      if (intentos < 20) {
        setTimeout(() => this.inicializarGoogle(intentos + 1), 250);
      } else {
        // Google es opcional: no bloquear otros formularios.
        console.warn('No se pudo cargar Google Login.');
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

  // ABRIR RECUPERACIÓN
  abrirRecuperacion(): void {
    if (this.cargando()) return;

    this.recuperandoPassword.set(true);
    this.codigoEnviado.set(false);
    this.codigoRecuperacion = '';
    this.nuevaPassword = '';
    this.password = '';
    this.error.set('');
    this.mensaje.set('');
  }

  // VOLVER AL INICIO DE SESIÓN
  cerrarRecuperacion(): void {
    if (this.cargando()) return;

    this.recuperandoPassword.set(false);
    this.codigoEnviado.set(false);
    this.modoRegistro.set(false);

    this.codigoRecuperacion = '';
    this.nuevaPassword = '';
    this.password = '';

    this.error.set('');
    this.mensaje.set('');
  }

  // SOLICITAR CÓDIGO O RESTABLECER CONTRASEÑA
  recuperarPassword(): void {
    if (this.cargando()) return;

    this.error.set('');
    this.mensaje.set('');

    if (!this.correo.trim()) {
      this.error.set('Introduce tu correo electrónico.');
      return;
    }

    if (this.codigoEnviado()) {
      if (!/^\d{6}$/.test(this.codigoRecuperacion.trim())) {
        this.error.set('Introduce el código de 6 dígitos.');
        return;
      }

      if (!this.nuevaPassword) {
        this.error.set('Introduce tu nueva contraseña.');
        return;
      }
    }

    this.cargando.set(true);

    const request = this.codigoEnviado()
      ? this.authService.resetPassword(
          this.correo.trim(),
          this.codigoRecuperacion.trim(),
          this.nuevaPassword
        )
      : this.authService.forgotPassword(this.correo.trim());

    request.pipe(
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: response => {
        if (!response.success) {
          this.error.set(
            response.message || 'No se pudo completar la solicitud.'
          );
          return;
        }

        if (!this.codigoEnviado()) {
          this.codigoEnviado.set(true);
          this.mensaje.set(
            response.message ||
            'Revisa tu correo. Te enviamos un código de recuperación.'
          );
        } else {
          this.cerrarRecuperacion();
          this.mensaje.set(
            'Contraseña actualizada. Ya puedes iniciar sesión.'
          );
        }
      },
      error: err => {
        this.error.set(
          err.error?.message ||
          'Ocurrió un error al procesar la solicitud.'
        );
      }
    });
  }

  // INICIO DE SESIÓN Y REGISTRO
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

        this.mensaje.set(
          response.message || 'Operación exitosa.'
        );

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
