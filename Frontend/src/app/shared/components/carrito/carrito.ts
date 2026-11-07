import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import {
  PedidoService,
  CrearPedidoRequest,
} from '../../../services/pedido.service';


import {
  CurrencyPipe,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
} from '@angular/core';

import {
  TuiButton,
} from '@taiga-ui/core';

import {
  CartService,
} from '../../../services/cart';


@Component({
  selector: 'app-carrito',
  standalone: true,

  imports: [
    CurrencyPipe,
     FormsModule,
    TuiButton,
  ],

  templateUrl: './carrito.html',
  styleUrl: './carrito.less',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Carrito {

  /*
   * Público porque el HTML necesita
   * leer su estado.
   */
  readonly cartService =
    inject(CartService);

    readonly pedidoService = inject(PedidoService);

readonly procesandoPedido = signal(false);
readonly errorPedido = signal('');

readonly mostrarFormulario = signal(false);

abrirFormulario(): void {
  if (this.cartService.isEmpty()) return;

  this.errorPedido.set('');
  this.mostrarFormulario.set(true);
}

cerrarFormulario(): void {
  if (this.procesandoPedido()) return;

  this.mostrarFormulario.set(false);
}

datosPedido = {
  nombre_completo: '',
  telefono: '',
  correo: '',
  sede: '',
  direccion_base: '',
  tipo_entrega: 'retiro',
  detalles_entrega: '',
  metodo_pago: 'transferencia',
};

  /*
   * Número al que enviaremos el pedido.
   *
   * Más adelante podemos configurarlo
   * desde Layout:
   *
   * <app-carrito
   *   whatsappNumber="584121234567"
   * />
   *
   * Debe ir sin:
   * +
   * espacios
   * guiones
   */
  readonly whatsappNumber =
    input('');


  /*
   * ========================================
   * URL DE WHATSAPP
   * ========================================
   */

  readonly whatsappUrl =
    computed(() => {

      const phone =
        this.whatsappNumber()
          .replace(/\D/g, '');


      if (
        !phone ||
        this.cartService.isEmpty()
      ) {
        return '';
      }


      const lines: string[] = [
        'Hola, quiero realizar el siguiente pedido:',
        '',
      ];


      this.cartService
        .items()
        .forEach(
          (item) => {

            const subtotal =
              item.price *
              item.quantity;


            lines.push(
              `• ${item.name}`,
            );


            if (item.priceType) {

              lines.push(
                `  Tipo de precio: ${this.getPriceTypeLabel(
                  item.priceType,
                )}`,
              );
            }


            lines.push(
              `  Cantidad: ${item.quantity}`,
            );


            lines.push(
              `  Precio unitario: $${item.price.toFixed(
                2,
              )}`,
            );


            lines.push(
              `  Subtotal: $${subtotal.toFixed(
                2,
              )}`,
            );


            lines.push('');
          },
        );


      lines.push(
        `Total: $${this.cartService
          .totalPrice()
          .toFixed(2)}`,
      );


      const message =
        encodeURIComponent(
          lines.join('\n'),
        );


      return (
        `https://wa.me/${phone}` +
        `?text=${message}`
      );
    });


  /*
   * ========================================
   * CERRAR
   * ========================================
   */

  close(): void {

    this.cartService.close();
  }


  /*
   * ========================================
   * WHATSAPP
   * ========================================
   */
openWhatsApp(): void {
  if (this.procesandoPedido() || this.cartService.isEmpty()) {
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
      'Completa nombre, teléfono, correo y sede.',
    );
    return;
  }

  const itemsAgrupados = new Map<string, number>();

  for (const item of this.cartService.items()) {
    itemsAgrupados.set(
      item.id,
      (itemsAgrupados.get(item.id) ?? 0) + item.quantity,
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
      detalles: datos.detalles_entrega.trim(),
    },
    pago: {
      metodo: datos.metodo_pago,
    },
    items: Array.from(
      itemsAgrupados,
      ([producto_id, cantidad]) => ({
        producto_id,
        cantidad,
      }),
    ),
  };

  this.errorPedido.set('');
  this.procesandoPedido.set(true);

  // Abrimos la pestaña durante el clic del usuario para
  // evitar que el navegador bloquee WhatsApp.
  const whatsappWindow = window.open('', '_blank');

  this.pedidoService.crearPedido(pedido).subscribe({
    next: (response) => {
      this.procesandoPedido.set(false);

      const url = response.data?.whatsappUrl;

      if (!response.success || !url) {
        whatsappWindow?.close();
        this.errorPedido.set(
          'El servidor no devolvió el enlace de WhatsApp.',
        );
        return;
      }

      if (whatsappWindow) {
        whatsappWindow.location.href = url;
      } else {
        // En caso de bloqueo de ventanas emergentes,
        // mantenemos el enlace disponible para abrirlo.
        this.errorPedido.set(
          'Pedido registrado. El navegador bloqueó WhatsApp. ' +
          'Habilita las ventanas emergentes para este sitio.',
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
      'No se pudo registrar el pedido. Inténtalo nuevamente.',
  );
},
  });
}

  /*
   * ========================================
   * ESC
   * ========================================
   */

@HostListener('document:keydown.escape')
onEscape(): void {
  if (this.mostrarFormulario()) {
    this.cerrarFormulario();
    return;
  }

  if (this.cartService.isOpen()) {
    this.close();
  }
}

  /*
   * ========================================
   * NOMBRE DEL TIPO DE PRECIO
   * ========================================
   */

  private getPriceTypeLabel(
    priceType:
      'Detal' |
      'Mayor' |
      'GranMayor',
  ): string {

    if (
      priceType ===
      'GranMayor'
    ) {
      return 'Gran Mayor';
    }


    return priceType;
  }
}