
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import {
  ChangeDetectionStrategy,
  Component,
   computed,
  inject,
  signal,
} from '@angular/core';

import {
  Presupuesto,
  PresupuestoService,
} from '../../../services/presupuesto.service';

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './presupuestos.html',
  styleUrl: './presupuestos.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Presupuestos {
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly authService = inject(AuthService);

readonly puedeGestionarPresupuestos = computed(() => {
  const rol = this.authService.user()?.tipo?.trim().toUpperCase();

  return rol === 'ADMIN' || rol === 'F_VENTAS';
});

  readonly presupuestos = signal<Presupuesto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly presupuestoExpandido = signal<string | null>(null);
  readonly eliminandoId = signal<string | null>(null);

  constructor() {
    this.cargarPresupuestos();
  }

  cargarPresupuestos(): void {

    if (!this.puedeGestionarPresupuestos()) {
  this.error.set('No tienes permisos para consultar presupuestos.');
  return;
}
    this.cargando.set(true);
    this.error.set('');

    this.presupuestoService.listarPresupuestos().subscribe({
      next: (response) => {
        this.cargando.set(false);

        if (!response.success) {
          this.error.set('No se pudieron obtener los presupuestos.');
          return;
        }

        this.presupuestos.set(response.data ?? []);
      },

      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);

        console.error('ERROR AL LISTAR PRESUPUESTOS:', {
          status: error.status,
          respuesta: error.error,
          url: error.url,
        });

        this.error.set(
          error.error?.message ??
            'No se pudieron cargar los presupuestos.'
        );
      },
    });
  }

  alternarDetalle(id: string): void {
    this.presupuestoExpandido.update((actual) =>
      actual === id ? null : id
    );
  }

  eliminarPresupuesto(presupuesto: Presupuesto): void {
    if (!this.puedeGestionarPresupuestos()) {
  this.error.set('No tienes permisos para eliminar presupuestos.');
  return;
}
    if (this.eliminandoId()) {
      return;
    }

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar el presupuesto de "${presupuesto.nombre_cliente}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmado) {
      return;
    }

    this.eliminandoId.set(presupuesto.id);
    this.error.set('');
    this.mensaje.set('');

    this.presupuestoService
      .eliminarPresupuesto(presupuesto.id)
      .subscribe({
        next: (response) => {
          this.eliminandoId.set(null);

          if (!response.success) {
            this.error.set(
              response.message || 'No se pudo eliminar el presupuesto.'
            );
            return;
          }

          this.presupuestos.update((lista) =>
            lista.filter((item) => item.id !== presupuesto.id)
          );

          if (this.presupuestoExpandido() === presupuesto.id) {
            this.presupuestoExpandido.set(null);
          }

          this.mensaje.set('Presupuesto eliminado correctamente.');
        },

        error: (error: HttpErrorResponse) => {
          this.eliminandoId.set(null);

          console.error('ERROR AL ELIMINAR PRESUPUESTO:', {
            status: error.status,
            respuesta: error.error,
            url: error.url,
          });

          this.error.set(
            error.error?.message ??
              'No se pudo eliminar el presupuesto.'
          );
        },
      });
  }

  cantidadProductos(presupuesto: Presupuesto): number {
    return (presupuesto.detalles ?? []).reduce(
      (total, detalle) => total + detalle.cantidad,
      0
    );
  }
}
