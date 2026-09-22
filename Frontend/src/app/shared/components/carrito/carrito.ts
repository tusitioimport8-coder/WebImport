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

    const url =
      this.whatsappUrl();


    if (!url) {
      return;
    }


    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  }


  /*
   * ========================================
   * ESC
   * ========================================
   */

  @HostListener(
    'document:keydown.escape',
  )
  onEscape(): void {

    if (
      this.cartService.isOpen()
    ) {
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