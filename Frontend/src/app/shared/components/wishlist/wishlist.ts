import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';

import { CartPriceType, CartService } from '../../../services/cart';

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceType?: CartPriceType;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wishlist {
  private readonly cartService = inject(CartService);

  readonly items = input<readonly WishlistProduct[]>([]);
  readonly isOpen = input(false);

  readonly closeRequested = output<void>();
  readonly removeRequested = output<string>();

  close(): void {
    this.closeRequested.emit();
  }

  remove(productId: string): void {
    this.removeRequested.emit(productId);
  }

  addToCart(product: WishlistProduct): void {
    this.cartService.add({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      priceType: product.priceType,
    });

    this.close();
    this.cartService.open();
  }

  addAllToCart(): void {
  this.items().forEach((product) => {
    if (product.stock > 0) {
      this.cartService.add({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        priceType: product.priceType,
      });
    }
  });

  this.close();
  this.cartService.open();
}
  getQuantityInCart(product: WishlistProduct): number {
    return this.cartService.getQuantity(product.id, product.priceType);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
}