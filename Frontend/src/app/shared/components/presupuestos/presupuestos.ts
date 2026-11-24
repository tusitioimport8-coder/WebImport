import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../services/auth';
import { ProductService } from '../../../services/product.service';
import {
  DetallePresupuesto,
  EditarPresupuestoRequest,
  EstadoPresupuesto,
  Presupuesto,
  PresupuestoService,
} from '../../../services/presupuesto.service';

interface ProductoSeleccionable {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './presupuestos.html',
  styleUrl: './presupuestos.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Presupuestos {
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);

  readonly puedeGestionarPresupuestos = computed(() => {
    console.log('Verificando permisos para gestionar presupuestos...');
    const rol = this.authService.user()?.tipo?.trim().toUpperCase();
    return rol === 'ADMIN' || rol === 'F_VENTAS';
  });

  readonly presupuestos = signal<Presupuesto[]>([]);
  readonly filtroEstado = signal<EstadoPresupuesto | 'todos'>('todos');
  readonly filtroCliente = signal('');
  readonly presupuestosFiltrados = computed(() => {
    const estado = this.filtroEstado();
    const cliente = this.filtroCliente().trim().toLocaleLowerCase();
    const presupuestos = this.presupuestos();

    return presupuestos.filter((presupuesto) => {
      const coincideEstado = estado === 'todos' || presupuesto.estado === estado;
      const coincideCliente = presupuesto.nombre_cliente.toLocaleLowerCase().includes(cliente);

      return coincideEstado && coincideCliente;
    });
  });
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly nombresProductos = signal<Record<string, string>>({});
  readonly productosDisponibles = signal<ProductoSeleccionable[]>([]);

  readonly buscadorProducto = signal('');
  readonly selectorProductoAbierto = signal<number | null>(null);

  filtrarProductos(): ProductoSeleccionable[] {
    const busqueda = this.buscadorProducto().trim().toLowerCase();

    return this.productosDisponibles().filter((producto) =>
      producto.nombre.toLowerCase().includes(busqueda),
    );
  }

  abrirSelectorProducto(index: number): void {
    this.selectorProductoAbierto.set(this.selectorProductoAbierto() === index ? null : index);

    this.buscadorProducto.set('');
  }

  seleccionarProducto(index: number, productoId: string): void {
    this.actualizarDetalle(index, 'producto_id', productoId);
    this.selectorProductoAbierto.set(null);
    this.buscadorProducto.set('');
  }

  readonly presupuestoExpandido = signal<string | null>(null);
  readonly eliminandoId = signal<string | null>(null);
  readonly enviandoId = signal<string | null>(null);

  // EDICIÓN
  readonly editandoId = signal<string | null>(null);
  readonly guardando = signal(false);

  readonly edicionNombre = signal('');
  readonly edicionTelefono = signal('');
  readonly edicionDescuento = signal(0);
  readonly edicionEstado = signal<EstadoPresupuesto>('proceso');
  readonly edicionDetalles = signal<DetallePresupuesto[]>([]);

  readonly tiposPrecio = ['detal_usd', 'detal_bs', 'Mayor', 'GranMayor'];

  constructor() {
    this.cargarPresupuestos();
    this.cargarNombresProductos();
  }

  cargarNombresProductos(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        if (!response.success) return;

        const nombres: Record<string, string> = {};
        const productos: ProductoSeleccionable[] = [];

        for (const producto of response.data ?? []) {
          nombres[producto.id] = producto.nombre;

          productos.push({
            id: producto.id,
            nombre: producto.nombre,
          });
        }

        this.nombresProductos.set(nombres);
        this.productosDisponibles.set(
          productos.sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es', {
              sensitivity: 'base',
            }),
          ),
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error('ERROR AL CARGAR PRODUCTOS:', error);
      },
    });
  }

  nombreProducto(id: string): string {
    return this.nombresProductos()[id] ?? `Producto ${id.slice(0, 8)}`;
  }

  productoExiste(id: string): boolean {
    return this.productosDisponibles().some((producto) => producto.id === id);
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

  // INICIAR O CANCELAR EDICIÓN
  iniciarEdicion(presupuesto: Presupuesto): void {
    if (!this.puedeGestionarPresupuestos() || this.guardando()) return;

    if (this.editandoId() === presupuesto.id) {
      this.cancelarEdicion();
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    this.editandoId.set(presupuesto.id);
    this.presupuestoExpandido.set(null);

    this.edicionNombre.set(presupuesto.nombre_cliente);
    this.edicionTelefono.set(presupuesto.telefono_cliente ?? '');
    this.edicionDescuento.set(Number(presupuesto.descuento ?? 0));
    this.edicionEstado.set(presupuesto.estado ?? 'proceso');

    this.edicionDetalles.set((presupuesto.detalles ?? []).map((detalle) => ({ ...detalle })));
  }

  cancelarEdicion(): void {
    if (this.guardando()) return;

    this.editandoId.set(null);
    this.edicionDetalles.set([]);
  }

  actualizarDetalle(
    index: number,
    campo: 'producto_id' | 'cantidad' | 'tipo_precio',
    valor: string | number,
  ): void {
    this.edicionDetalles.update((detalles) =>
      detalles.map((detalle, i) => (i === index ? { ...detalle, [campo]: valor } : detalle)),
    );
  }

  agregarProducto(): void {
    const producto = this.productosDisponibles()[0];

    if (!producto) return;

    this.edicionDetalles.update((detalles) => [
      ...detalles,
      {
        producto_id: producto.id,
        cantidad: 1,
        tipo_precio: 'detal_usd',
        precio_unitario: 0,
      },
    ]);
  }

  quitarProducto(index: number): void {
    if (this.edicionDetalles().length <= 1) return;

    this.edicionDetalles.update((detalles) => detalles.filter((_, i) => i !== index));
  }

  guardarEdicion(): void {
    if (!this.puedeGestionarPresupuestos() || this.guardando()) return;

    const id = this.editandoId();
    if (!id) return;

    const nombre = this.edicionNombre().trim();
    const descuento = Number(this.edicionDescuento());
    const detalles = this.edicionDetalles();

    if (nombre.length < 2) {
      this.error.set('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
      this.error.set('El descuento debe estar entre 0 y 100.');
      return;
    }

    if (
      detalles.length === 0 ||
      detalles.some(
        (detalle) =>
          !detalle.producto_id ||
          !Number.isInteger(Number(detalle.cantidad)) ||
          Number(detalle.cantidad) <= 0 ||
          !this.tiposPrecio.includes(detalle.tipo_precio),
      )
    ) {
      this.error.set('Revisa los productos y sus cantidades.');
      return;
    }

    const datos: EditarPresupuestoRequest = {
      nombre_cliente: nombre,
      telefono_cliente: this.edicionTelefono().trim(),
      descuento,
      estado: this.edicionEstado(),
      detalles: detalles.map((detalle) => ({
        producto_id: detalle.producto_id,
        cantidad: Number(detalle.cantidad),
        tipo_precio: detalle.tipo_precio,
      })),
    };

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.presupuestoService.editarPresupuesto(id, datos).subscribe({
      next: (response) => {
        this.guardando.set(false);

        if (!response.data) {
          this.error.set(response.message ?? 'No se recibió el presupuesto actualizado.');
          return;
        }

        this.presupuestos.update((lista) =>
          lista.map((presupuesto) => (presupuesto.id === id ? response.data! : presupuesto)),
        );

        this.editandoId.set(null);
        this.edicionDetalles.set([]);
        this.mensaje.set('Presupuesto actualizado correctamente.');
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);

        console.error('ERROR AL EDITAR PRESUPUESTO:', {
          status: error.status,
          respuesta: error.error,
          url: error.url,
        });

        this.error.set(error.error?.message ?? 'No se pudo actualizar el presupuesto.');
      },
    });
  }

  // ELIMINAR
  eliminarPresupuesto(presupuesto: Presupuesto): void {
    if (!this.puedeGestionarPresupuestos()) {
      this.error.set('No tienes permisos para eliminar presupuestos.');
      return;
    }

    if (this.eliminandoId() || this.guardando()) return;

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar el presupuesto de "${presupuesto.nombre_cliente}"?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmado) return;

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

        if (this.editandoId() === presupuesto.id) {
          this.cancelarEdicion();
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

  // WHATSAPP
  enviarPorWhatsApp(presupuesto: Presupuesto): void {
    if (!this.puedeGestionarPresupuestos()) {
      this.error.set('No tienes permisos para enviar presupuestos.');
      return;
    }

    if (this.enviandoId() || this.guardando()) return;

    this.error.set('');
    this.mensaje.set('');

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
