import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { CartPriceType, CartPrices } from './cart';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceType?: CartPriceType;
  prices?: CartPrices;
}


@Injectable({ providedIn: 'root' })
export class WishlistService {
  readonly items = signal<WishlistItem[]>([]);
  readonly isOpen = signal(false);
  readonly totalItems = computed(() => this.items().length);

  has(productId: string): boolean {
    return this.items().some((item) => item.id === productId);
  }

  toggle(product: WishlistItem): void {
    this.items.update((items) =>
      items.some((item) => item.id === product.id)
        ? items.filter((item) => item.id !== product.id)
        : [...items, product],
    );
  }

  remove(productId: string): void {
    this.items.update((items) => items.filter((item) => item.id !== productId));
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
