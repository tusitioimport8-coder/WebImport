import {
  Component,
  HostListener,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.less'
})
export class MiPerfil {
  readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  readonly isOpen = input(false);
  readonly closeRequested = output<void>();

  readonly cerrandoSesion = signal(false);
  readonly error = signal('');

  close(): void {
    this.closeRequested.emit();
  }

cerrarSesion(): void {
  if (this.cerrandoSesion()) return;

  this.error.set('');
  this.cerrandoSesion.set(true);

  this.authService.logout()
    .pipe(
      finalize(() => this.cerrandoSesion.set(false))
    )
    .subscribe({
      next: response => {
        if (!response.success) {
          this.error.set(
            response.message || 'No se pudo cerrar sesión.'
          );
          return;
        }

        // AuthService.logout() ya limpia el usuario.
        // No cerramos el panel.
        // No navegamos a /sesion.
      },
      error: err => {
        this.error.set(
          err.error?.message ||
          'No se pudo cerrar sesión. Inténtalo nuevamente.'
        );
      }
    });
}

  irASesion(): void {
  this.router.navigate(['/sesion']);
}
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}