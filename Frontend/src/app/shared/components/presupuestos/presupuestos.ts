import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import { ProductService } from '../../../services/product.service';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Presupuesto, PresupuestoService } from '../../../services/presupuesto.service';

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
  private readonly productService = inject(ProductService);
  readonly enviandoId = signal<string | null>(null);

  readonly nombresProductos = signal<Record<string, string>>({});
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
    this.cargarNombresProductos();
  }

  cargarNombresProductos(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        if (!response.success) return;

        const nombres: Record<string, string> = {};

        for (const producto of response.data ?? []) {
          nombres[producto.id] = producto.nombre;
        }

        this.nombresProductos.set(nombres);
      },
      error: (error: HttpErrorResponse) => {
        console.error('ERROR AL CARGAR NOMBRES DE PRODUCTOS:', error);
      },
    });
  }

  nombreProducto(id: string): string {
    return this.nombresProductos()[id] ?? `Producto ${id.slice(0, 8)}`;
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

        this.error.set(error.error?.message ?? 'No se pudieron cargar los presupuestos.');
      },
    });
  }

  alternarDetalle(id: string): void {
    this.presupuestoExpandido.update((actual) => (actual === id ? null : id));
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
      `¿Seguro que deseas eliminar el presupuesto de "${presupuesto.nombre_cliente}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) {
      return;
    }

    this.eliminandoId.set(presupuesto.id);
    this.error.set('');
    this.mensaje.set('');

    this.presupuestoService.eliminarPresupuesto(presupuesto.id).subscribe({
      next: (response) => {
        this.eliminandoId.set(null);

        if (!response.success) {
          this.error.set(response.message || 'No se pudo eliminar el presupuesto.');
          return;
        }

        this.presupuestos.update((lista) => lista.filter((item) => item.id !== presupuesto.id));

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

        this.error.set(error.error?.message ?? 'No se pudo eliminar el presupuesto.');
      },
    });
  }

  cantidadProductos(presupuesto: Presupuesto): number {
    return (presupuesto.detalles ?? []).reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  enviarPorWhatsApp(presupuesto: Presupuesto): void {
    if (!this.puedeGestionarPresupuestos()) {
      this.error.set('No tienes permisos para enviar presupuestos.');
      return;
    }

    if (this.enviandoId()) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    // Abrimos una pestaña desde el evento del usuario
    // para evitar que el navegador bloquee la ventana.
    const ventana = window.open('about:blank', '_blank');

    if (!ventana) {
      this.error.set('No se pudo abrir WhatsApp. Verifica los permisos de ventanas emergentes.');
      return;
    }

    ventana.opener = null;

    this.enviandoId.set(presupuesto.id);

    this.presupuestoService
      .enviarPresupuesto({
        presupuestoId: presupuesto.id,
        telefonoSolicitado: presupuesto.telefono_cliente || undefined,
      })
      .subscribe({
        next: (response) => {
          this.enviandoId.set(null);

          if (!response.success || !response.data?.whatsappUrl) {
            ventana.close();

            this.error.set(response.message || 'No se pudo generar el enlace de WhatsApp.');
            return;
          }

          // Redirigir la nueva pestaña al enlace generado.
          ventana.location.href = response.data.whatsappUrl;

          this.mensaje.set('Enlace de WhatsApp generado correctamente.');
        },

        error: (error: HttpErrorResponse) => {
          this.enviandoId.set(null);
          ventana.close();

          console.error('ERROR AL ENVIAR PRESUPUESTO POR WHATSAPP:', {
            status: error.status,
            respuesta: error.error,
            url: error.url,
          });

          this.error.set(error.error?.message ?? 'No se pudo generar el enlace de WhatsApp.');
        },
      });
  }
}
