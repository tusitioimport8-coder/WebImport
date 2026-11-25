import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth';
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
  private readonly authService = inject(AuthService);
  private readonly storageKeyPrefix = 'tusitio:wishlist:';
  private loadedUserId: string | null = null;

  readonly items = signal<WishlistItem[]>([]);
  readonly isOpen = signal(false);
  readonly sessionRequired = signal(false);
  readonly totalItems = computed(() => this.items().length);

  constructor() {
    effect(() => {
      const userId = this.authService.user()?.id ?? null;

      if (userId !== this.loadedUserId) {
        this.loadForUser(userId);
      }
    });
  }

  has(productId: string): boolean {
    return this.items().some((item) => item.id === productId);
  }

  toggle(product: WishlistItem): void {
    const userId = this.authService.user()?.id;

    if (!userId) {
      this.requireSession();
      return;
    }

    this.ensureUserLoaded(userId);
    this.items.update((items) =>
      items.some((item) => item.id === product.id)
        ? items.filter((item) => item.id !== product.id)
        : [...items, product],
    );
    this.saveForUser(userId);
  }

  remove(productId: string): void {
    const userId = this.authService.user()?.id;

    if (!userId) {
      return;
    }

    this.ensureUserLoaded(userId);
    this.items.update((items) => items.filter((item) => item.id !== productId));
    this.saveForUser(userId);
  }

  open(): void {
    if (!this.authService.user()) {
      this.requireSession();
      return;
    }

    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  dismissSessionPrompt(): void {
    this.sessionRequired.set(false);
  }

  private requireSession(): void {
    this.sessionRequired.set(true);
  }

  private ensureUserLoaded(userId: string): void {
    if (userId !== this.loadedUserId) {
      this.loadForUser(userId);
    }
  }

  private loadForUser(userId: string | null): void {
    this.loadedUserId = userId;
    this.items.set(userId ? this.readForUser(userId) : []);
  }

  private readForUser(userId: string): WishlistItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.storageKey(userId));

      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        console.error('[WISHLIST] El formato guardado no es válido.');
        return [];
      }

      return parsed.filter(this.isWishlistItem);
    } catch (error) {
      console.error('[WISHLIST] No se pudo leer localStorage:', error);
      return [];
    }
  }

  private saveForUser(userId: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const key = this.storageKey(userId);
      const items = this.items();

      if (items.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(items));
      }
    } catch (error) {
      console.error('[WISHLIST] No se pudo guardar en localStorage:', error);
    }
  }

  private storageKey(userId: string): string {
    return `${this.storageKeyPrefix}${userId}`;
  }

  private isWishlistItem(item: unknown): item is WishlistItem {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const candidate = item as Record<string, unknown>;

    return (
      typeof candidate['id'] === 'string' &&
      typeof candidate['name'] === 'string' &&
      typeof candidate['price'] === 'number' &&
      typeof candidate['stock'] === 'number'
    );
  }
}
