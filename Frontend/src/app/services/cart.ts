import {
  Injectable,
  computed,
  signal,
} from '@angular/core';


export type CartPriceType =
  | 'Detal'
  | 'Mayor'
  | 'GranMayor';


export interface CartProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;

  /*
   * Nos permitirá distinguir posteriormente
   * si el producto fue agregado como:
   *
   * Detal
   * Mayor
   * GranMayor
   */
  priceType?: CartPriceType;
}


export interface CartItem
  extends CartProduct {

  /*
   * Identificador único de la línea.
   *
   * Así el mismo producto podría estar
   * en el carrito con precios diferentes.
   */
  lineId: string;

  quantity: number;
}


@Injectable({
  providedIn: 'root',
})
export class CartService {

  /*
   * ========================================
   * ESTADO
   * ========================================
   */

  private readonly itemsState =
    signal<CartItem[]>([]);


  private readonly openState =
    signal(false);


  /*
   * Los componentes externos solamente
   * pueden leer estos signals.
   */
  readonly items =
    this.itemsState.asReadonly();


  readonly isOpen =
    this.openState.asReadonly();


  /*
   * ========================================
   * VALORES CALCULADOS
   * ========================================
   */

  readonly totalItems =
    computed(() => {

      return this.itemsState()
        .reduce(
          (total, item) =>
            total + item.quantity,
          0,
        );
    });


  readonly totalPrice =
    computed(() => {

      return this.itemsState()
        .reduce(
          (total, item) =>
            total +
            item.price *
              item.quantity,
          0,
        );
    });


  readonly isEmpty =
    computed(
      () =>
        this.itemsState().length === 0,
    );


  /*
   * ========================================
   * PANEL DEL CARRITO
   * ========================================
   */

  open(): void {
    this.openState.set(true);
  }


  close(): void {
    this.openState.set(false);
  }


  toggle(): void {

    this.openState.update(
      (current) => !current,
    );
  }


  /*
   * ========================================
   * AGREGAR PRODUCTO
   * ========================================
   */

  add(
    product: CartProduct,
    quantity = 1,
  ): void {

    if (
      product.stock <= 0 ||
      quantity <= 0
    ) {
      return;
    }


    const lineId =
      this.createLineId(product);


    this.itemsState.update(
      (items) => {

        const existing =
          items.find(
            (item) =>
              item.lineId === lineId,
          );


        /*
         * El producto ya está en el carrito.
         */
        if (existing) {

          return items.map(
            (item) => {

              if (
                item.lineId !== lineId
              ) {
                return item;
              }


              return {
                ...item,

                quantity:
                  Math.min(
                    item.quantity +
                      quantity,

                    item.stock,
                  ),
              };
            },
          );
        }


        /*
         * Producto nuevo.
         */
        return [
          ...items,

          {
            ...product,

            lineId,

            quantity:
              Math.min(
                quantity,
                product.stock,
              ),
          },
        ];
      },
    );
  }


  /*
   * ========================================
   * AUMENTAR CANTIDAD
   * ========================================
   */

  increase(
    lineId: string,
  ): void {

    this.itemsState.update(
      (items) =>
        items.map(
          (item) => {

            if (
              item.lineId !== lineId
            ) {
              return item;
            }


            return {
              ...item,

              quantity:
                Math.min(
                  item.quantity + 1,
                  item.stock,
                ),
            };
          },
        ),
    );
  }


  /*
   * ========================================
   * REDUCIR CANTIDAD
   * ========================================
   */

  decrease(
    lineId: string,
  ): void {

    this.itemsState.update(
      (items) =>
        items
          .map(
            (item) => {

              if (
                item.lineId !== lineId
              ) {
                return item;
              }


              return {
                ...item,

                quantity:
                  item.quantity - 1,
              };
            },
          )
          .filter(
            (item) =>
              item.quantity > 0,
          ),
    );
  }


  /*
   * ========================================
   * ELIMINAR
   * ========================================
   */

  remove(
    lineId: string,
  ): void {

    this.itemsState.update(
      (items) =>
        items.filter(
          (item) =>
            item.lineId !== lineId,
        ),
    );
  }


  /*
   * ========================================
   * VACIAR
   * ========================================
   */

  clear(): void {

    this.itemsState.set([]);
  }


  /*
   * ========================================
   * CONSULTAR CANTIDAD
   * ========================================
   */

getQuantity(
  productId: string,
  priceType?: CartPriceType,
): number {

  const lineId =
    this.createLineId({
      id: productId,
      priceType,
    });


  return (
    this.itemsState()
      .find(
        (item) =>
          item.lineId === lineId,
      )
      ?.quantity ?? 0
  );
}


  /*
   * ========================================
   * ID INTERNO DE UNA LÍNEA
   * ========================================
   */

  private createLineId(
  product: Pick<
    CartProduct,
    'id' | 'priceType'
  >,
): string {

  return [
    product.id,
    product.priceType ??
      'default',
  ].join('::');
} }