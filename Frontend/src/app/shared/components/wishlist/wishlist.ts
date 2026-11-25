import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  CartPriceType,
  CartPrices,
  CartService,
} from '../../../services/cart';
import { WishlistService } from '../../../services/wishlist.service';


export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  stock: number;

prices?: CartPrices;

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
  private readonly router = inject(Router);
  readonly wishlistService = inject(WishlistService);

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

  dismissSessionPrompt(): void {
    this.wishlistService.dismissSessionPrompt();
  }

  goToSession(): void {
    this.dismissSessionPrompt();
    void this.router.navigate(['/sesion']);
  }

addToCart(product: WishlistProduct): void {
  if (product.stock <= 0) {
    return;
  }

  this.cartService.add({
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl,
    priceType: product.priceType,
    prices: product.prices,
  });

  this.remove(product.id);
  this.close();
  this.cartService.open();
}


addAllToCart(): void {
  this.items().forEach(product => {
    if (product.stock > 0) {
      this.cartService.add({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        priceType: product.priceType,
        prices: product.prices,
      });
      this.remove(product.id);
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
    if (this.wishlistService.sessionRequired()) {
      this.dismissSessionPrompt();
      return;
    }

    if (this.isOpen()) {
      this.close();
    }
  }
}