
import { Injectable, computed, signal } from '@angular/core';

export type CartPriceType =
  | 'Detal'
  | 'detal_usd'
  | 'detal_bs'
  | 'Mayor'
  | 'GranMayor';

export type CartMode = 'detal_bs' | 'detal_usd';

export type CartPrices = Partial<Record<
  'detal_bs' | 'detal_usd' | 'Mayor' | 'GranMayor',
  number
>>;

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceType?: CartPriceType;
  prices?: CartPrices;
}

export interface CartItem extends CartProduct {
  lineId: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly itemsState = signal<CartItem[]>([]);
  private readonly openState = signal(false);
  private readonly modeState = signal<CartMode>('detal_bs');

  readonly isOpen = this.openState.asReadonly();
  readonly priceMode = this.modeState.asReadonly();

  readonly totalItems = computed(() =>
    this.itemsState().reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

  readonly baseTotalUSD = computed(() =>
    this.itemsState().reduce((total, item) => {
      const price = item.prices?.detal_usd;

      return total +
        (price !== undefined ? price : item.price) *
        item.quantity;
    }, 0)
  );

  readonly currentTier = computed<
    'detal_usd' | 'Mayor' | 'GranMayor'
  >(() => {
    const units = this.totalItems();
    const amount = this.baseTotalUSD();

    if (units >= 40 && amount >= 200) {
      return 'GranMayor';
    }

    if (units >= 6 && amount >= 50) {
      return 'Mayor';
    }

    return 'detal_usd';
  });

  readonly nextTier = computed(() => {
    if (this.modeState() === 'detal_bs') {
      return null;
    }

    const current = this.currentTier();

    if (current === 'GranMayor') {
      return null;
    }

    const target =
      current === 'Mayor'
        ? { name: 'Gran Mayor', units: 40, amount: 200 }
        : { name: 'Mayor', units: 6, amount: 50 };

    return {
      name: target.name,
      missingUnits: Math.max(
        0,
        target.units - this.totalItems()
      ),
      missingAmount: Math.max(
        0,
        target.amount - this.baseTotalUSD()
      ),
      progress: Math.round(
        Math.min(
          1,
          this.totalItems() / target.units,
          this.baseTotalUSD() / target.amount
        ) * 100
      ),
    };
  });

  readonly items = computed<CartItem[]>(() => {
    const type: CartPriceType =
      this.modeState() === 'detal_bs'
        ? 'detal_bs'
        : this.currentTier();

    return this.itemsState().map(item => ({
      ...item,
      priceType: type,
      price: this.getPrice(item, type),
    }));
  });

  readonly totalPrice = computed(() =>
    this.items().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  );

  readonly isEmpty = computed(
    () => this.itemsState().length === 0
  );

  setPriceMode(mode: CartMode): void {
    this.modeState.set(mode);
  }

  private getPrice(
    item: CartItem,
    type: CartPriceType
  ): number {
    if (type === 'detal_bs') {
      return item.prices?.detal_bs ??
        item.prices?.detal_usd ??
        item.price;
    }

    if (type === 'GranMayor') {
      return item.prices?.GranMayor ??
        item.prices?.Mayor ??
        item.prices?.detal_usd ??
        item.price;
    }

    if (type === 'Mayor') {
      return item.prices?.Mayor ??
        item.prices?.detal_usd ??
        item.price;
    }

    return item.prices?.detal_usd ?? item.price;
  }

  open(): void {
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }

  toggle(): void {
    this.openState.update(current => !current);
  }

  add(product: CartProduct, quantity = 1): void {
    console.log('[CARRITO] Producto agregado:', {
  nombre: product.name,
  precioOriginal: product.price,
  preciosDisponibles: product.prices
});
    const stock = Number(product.stock);
    const amount = Math.floor(Number(quantity));

    if (
      !Number.isFinite(stock) ||
      stock <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    const lineId = product.id;

    this.itemsState.update(items => {
      const existing = items.find(
        item => item.lineId === lineId
      );

      if (existing) {
        return items.map(item =>
          item.lineId === lineId
            ? {
                ...item,
                name: product.name,
                stock,
                imageUrl: product.imageUrl,
                prices: {
                  ...item.prices,
                  ...product.prices,
                },
                quantity: Math.min(
                  item.quantity + amount,
                  stock
                ),
              }
            : item
        );
      }

      return [
        ...items,
        {
          ...product,
          lineId,
          quantity: Math.min(amount, stock),
        },
      ];
    });
  }

  increase(lineId: string): void {
    this.itemsState.update(items =>
      items.map(item =>
        item.lineId === lineId
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                item.stock
              ),
            }
          : item
      )
    );
  }

  decrease(lineId: string): void {
    this.itemsState.update(items =>
      items
        .map(item =>
          item.lineId === lineId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  remove(lineId: string): void {
    this.itemsState.update(items =>
      items.filter(item => item.lineId !== lineId)
    );
  }

  clear(): void {
    this.itemsState.set([]);
  }

  getQuantity(
    productId: string,
    _priceType?: CartPriceType
  ): number {
    return this.itemsState()
      .find(item => item.id === productId)
      ?.quantity ?? 0;
  }
}
