
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

import { AuthService } from '../../../services/auth';
import { CartPriceType, CartService } from '../../../services/cart';
import {
  PedidoService,
  CrearPedidoRequest,
} from '../../../services/pedido.service';
import {
  PresupuestoService,
  CrearPresupuestoRequest,
  DetallePresupuesto,
} from '../../../services/presupuesto.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, TuiButton],
  templateUrl: './carrito.html',
  styleUrl: './carrito.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carrito {
  readonly cartService = inject(CartService);
  readonly pedidoService = inject(PedidoService);
  readonly authService = inject(AuthService);
  private readonly presupuestoService = inject(PresupuestoService);

  // FUERZA DE VENTAS
  readonly esFuerzaVentas = computed(
    () =>
      this.authService.user()?.tipo?.trim().toUpperCase() ===
      'F_VENTAS'
  );


readonly esAdmin = computed(
  () =>
    this.authService.user()?.tipo?.trim().toUpperCase() ===
    'ADMIN'
);

readonly puedeCrearPresupuesto = computed(
  () => this.esFuerzaVentas() || this.esAdmin()
);


  readonly procesandoPresupuesto = signal(false);
  readonly errorPresupuesto = signal('');
  readonly presupuestoCreado = signal('');
  readonly mostrarFormularioPresupuesto = signal(false);

  datosPresupuesto = {
    nombre_cliente: '',
    telefono_cliente: '',
    descuento: 0,
  };

  readonly totalPresupuesto = computed(() => {
    const subtotal = this.cartService.totalPrice();
    const descuento = Number(this.datosPresupuesto.descuento) || 0;

    return Math.max(0, subtotal - descuento);
  });

  abrirFormularioPresupuesto(): void {
    if (
      !this.puedeCrearPresupuesto() ||
      this.cartService.isEmpty() ||
      this.procesandoPresupuesto()
    ) {
      return;
    }

    this.errorPresupuesto.set('');
    this.mostrarFormularioPresupuesto.set(true);
  }

  cerrarFormularioPresupuesto(): void {
    if (this.procesandoPresupuesto()) return;

    this.mostrarFormularioPresupuesto.set(false);
    this.errorPresupuesto.set('');
  }

  // PEDIDOS NORMALES
  readonly procesandoPedido = signal(false);
  readonly errorPedido = signal('');
  readonly mostrarFormulario = signal(false);

  datosPedido = {
    nombre_completo: '',
    telefono: '',
    correo: '',
    sede: '',
    direccion_base: '',
    tipo_entrega: 'retiro',
    metodo_pago: 'transferencia',
  };

  readonly whatsappNumber = input('');

  readonly whatsappUrl = computed(() => {
    const phone = this.whatsappNumber().replace(/\D/g, '');

    if (!phone || this.cartService.isEmpty()) {
      return '';
    }

    const lines: string[] = [
      'Hola, quiero realizar el siguiente pedido:',
      '',
    ];

    this.cartService.items().forEach((item) => {
      const subtotal = item.price * item.quantity;

      lines.push(`• ${item.name}`);

      if (item.priceType) {
        lines.push(
          `  Tipo de precio: ${this.getPriceTypeLabel(item.priceType)}`
        );
      }

      lines.push(
        `  Cantidad: ${item.quantity}`,
        `  Precio unitario: $${item.price.toFixed(2)}`,
        `  Subtotal: $${subtotal.toFixed(2)}`,
        ''
      );
    });

    lines.push(
      `Total: $${this.cartService.totalPrice().toFixed(2)}`
    );

    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  });

  abrirFormulario(): void {
    if (this.cartService.isEmpty() || this.esFuerzaVentas()) {
      return;
    }

    this.errorPedido.set('');
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    if (this.procesandoPedido()) return;
    this.mostrarFormulario.set(false);
  }

  close(): void {
    this.cartService.close();
  }

  // REGISTRAR PEDIDO NORMAL
  openWhatsApp(): void {
    if (
      this.esFuerzaVentas() ||
      this.procesandoPedido() ||
      this.cartService.isEmpty()
    ) {
      return;
    }

    const datos = this.datosPedido;

    if (
      !datos.nombre_completo.trim() ||
      !datos.telefono.trim() ||
      !datos.correo.trim() ||
      !datos.sede.trim()
    ) {
      this.errorPedido.set(
        'Completa nombre, teléfono, correo y sede.'
      );
      return;
    }

    const itemsAgrupados = new Map<string, number>();

    for (const item of this.cartService.items()) {
      itemsAgrupados.set(
        item.id,
        (itemsAgrupados.get(item.id) ?? 0) + item.quantity
      );
    }

    const pedido: CrearPedidoRequest = {
      contacto: {
        nombre_completo: datos.nombre_completo.trim(),
        telefono: datos.telefono.trim(),
        correo: datos.correo.trim(),
        sede: datos.sede.trim(),
        direccion_base: datos.direccion_base.trim(),
      },
   entrega: {
  tipo: datos.tipo_entrega,
  detalles: '',
},
      pago: {
        metodo: datos.metodo_pago,
      },
      items: Array.from(
        itemsAgrupados,
        ([producto_id, cantidad]) => ({
          producto_id,
          cantidad,
        })
      ),
    };

    this.errorPedido.set('');
    this.procesandoPedido.set(true);

    const whatsappWindow = window.open('', '_blank');

    this.pedidoService.crearPedido(pedido).subscribe({
      next: (response) => {
        this.procesandoPedido.set(false);

        const url = response.data?.whatsappUrl;

        if (!response.success || !url) {
          whatsappWindow?.close();
          this.errorPedido.set(
            'El servidor no devolvió el enlace de WhatsApp.'
          );
          return;
        }

        if (whatsappWindow) {
          whatsappWindow.location.href = url;
        } else {
          this.errorPedido.set(
            'Pedido registrado. El navegador bloqueó WhatsApp. ' +
            'Habilita las ventanas emergentes para este sitio.'
          );
        }

        this.cartService.clear();
        this.mostrarFormulario.set(false);
        this.close();
      },

      error: (error: HttpErrorResponse) => {
        whatsappWindow?.close();
        this.procesandoPedido.set(false);

        console.error('ERROR PEDIDO:', {
          status: error.status,
          respuesta: error.error,
          url: error.url,
        });

        this.errorPedido.set(
          error.error?.message ??
          'No se pudo registrar el pedido. Inténtalo nuevamente.'
        );
      },
    });
  }

  // REGISTRAR PRESUPUESTO DE FUERZA DE VENTAS
  enviarPresupuesto(): void {
    if (
      !this.esFuerzaVentas() ||
      !this.mostrarFormularioPresupuesto() ||
      this.cartService.isEmpty() ||
      this.procesandoPresupuesto()
    ) {
      return;
    }

    const nombreCliente =
      this.datosPresupuesto.nombre_cliente.trim();

    const telefonoCliente =
      this.datosPresupuesto.telefono_cliente.trim();

    const descuento = Number(
      this.datosPresupuesto.descuento
    );

    const subtotal = this.cartService.totalPrice();
    const total = subtotal - descuento;

    if (nombreCliente.length < 2) {
      this.errorPresupuesto.set(
        'El nombre del cliente debe tener al menos 2 caracteres.'
      );
      return;
    }

    if (
      !Number.isFinite(descuento) ||
      descuento < 0
    ) {
      this.errorPresupuesto.set(
        'El descuento debe ser un número válido mayor o igual a cero.'
      );
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      this.errorPresupuesto.set(
        'El total del presupuesto debe ser mayor que cero.'
      );
      return;
    }

    const detalles: DetallePresupuesto[] =
      this.cartService.items().map(item => ({
        producto_id: item.id,
        cantidad: item.quantity,
        precio_unitario: item.price,
        tipo_precio: item.priceType || 'Mayor',
      }));

    const detallesValidos = detalles.every(
      detalle =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          detalle.producto_id
        ) &&
        Number.isInteger(detalle.cantidad) &&
        detalle.cantidad > 0 &&
        Number.isFinite(detalle.precio_unitario) &&
        detalle.precio_unitario > 0 &&
        detalle.tipo_precio.trim().length > 0
    );

    if (!detalles.length || !detallesValidos) {
      this.errorPresupuesto.set(
        'Hay productos con datos inválidos en el carrito.'
      );
      return;
    }

    const bodyPresupuesto: CrearPresupuestoRequest = {
      nombre_cliente: nombreCliente,
      telefono_cliente: telefonoCliente,
      descuento,
      total,
      detalles,
    };

    this.errorPresupuesto.set('');
    this.presupuestoCreado.set('');
    this.procesandoPresupuesto.set(true);

    this.presupuestoService
      .crearPresupuesto(bodyPresupuesto)
      .subscribe({
        next: (response) => {
          this.procesandoPresupuesto.set(false);

          if (!response.success || !response.data?.id) {
            this.errorPresupuesto.set(
              'No se pudo confirmar el presupuesto.'
            );
            return;
          }

          this.presupuestoCreado.set(response.data.id);
          this.mostrarFormularioPresupuesto.set(false);

          this.datosPresupuesto = {
            nombre_cliente: '',
            telefono_cliente: '',
            descuento: 0,
          };

          this.cartService.clear();
        },

        error: (error: HttpErrorResponse) => {
          this.procesandoPresupuesto.set(false);

          console.error('ERROR PRESUPUESTO:', {
            status: error.status,
            respuesta: error.error,
            url: error.url,
          });

          this.errorPresupuesto.set(
            error.error?.message ??
            'No se pudo registrar el presupuesto.'
          );
        },
      });
  }

  cerrarConfirmacionPresupuesto(): void {
    this.presupuestoCreado.set('');
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.presupuestoCreado()) {
      this.cerrarConfirmacionPresupuesto();
      return;
    }

    if (this.mostrarFormularioPresupuesto()) {
      this.cerrarFormularioPresupuesto();
      return;
    }

    if (this.mostrarFormulario()) {
      this.cerrarFormulario();
      return;
    }

    if (this.cartService.isOpen()) {
      this.close();
    }
  }

  private getPriceTypeLabel(priceType: CartPriceType): string {
    switch (priceType) {
      case 'detal_usd':
        return 'Detal (USD)';
      case 'detal_bs':
        return 'Detal (BCV)';
      case 'Detal':
        return 'Detal';
      case 'GranMayor':
        return 'Gran Mayor';
      default:
        return priceType;
    }
  }
}
