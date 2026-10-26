import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.less',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('Frontend');

  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.checkSession().subscribe({
      next: response => {
        if (response.success && response.user) {
          console.log('Sesión recuperada:', response.user.tipo);
        } else {
          console.log('No hay sesión activa');
        }
      },
      error: error => {
        console.error('Error al verificar sesión:', error);
      }
    });
  }
}