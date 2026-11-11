
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { SiteHeader } from '../../shared/components/site-header/site-header';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
import { Wishlist } from '../../shared/components/wishlist/wishlist';
import { MiPerfil } from '../../shared/components/mi-perfil/mi-perfil';
import { Carrito } from '../../shared/components/carrito/carrito';

import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

import {
  ApiProduct,
  ProductPriceType,
  ProductService
} from '../../services/product.service';

type TipoPrecioVisual = ProductPriceType | 'DetalBCV';

interface ProductPriceOption {
  type: TipoPrecioVisual;
  label: string;
  moneda: 'BCV' | 'Divisas';
  price: number;
  available: boolean;
}

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [
    CommonModule,
    Carrito,
    Wishlist,
    MiPerfil,
    SiteHeader,
    SiteFooter
  ],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetalleProducto implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  // AUTENTICACIÓN Y PERMISOS
  readonly authService = inject(AuthService);

  readonly canAccessAdmin = computed(() =>
    this.authService.user()?.tipo?.trim().toUpperCase() === 'ADMIN'
  );

  readonly canAccessInventory = computed(() => {
    const rol = this.authService.user()?.tipo?.trim().toUpperCase();
    return rol === 'ADMIN' || rol === 'MARKETING';
  });

  // PANEL MI PERFIL
  readonly perfilAbierto = signal(false);

  abrirPerfil(): void {
    this.perfilAbierto.set(true);
  }

  cerrarPerfil(): void {
    this.perfilAbierto.set(false);
  }

  // TASA BCV
  readonly tasaBCV = 885.14;

  formatearBCV(precioUSD: number): string {
    return (precioUSD * this.tasaBCV).toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // HEADER
  readonly headerSearchTerm = signal('');
  readonly cartHeaderTotalItems = this.cartService.totalItems;
  readonly wishlistTotalItems = this.wishlistService.totalItems;

  onHeaderSearchChange(value: string): void {
    this.headerSearchTerm.set(value);
  }

  openHeaderCart(): void {
    this.cartService.open();
  }

  // WISHLIST
  readonly wishlistOpen = this.wishlistService.isOpen;
  readonly wishlistProducts = this.wishlistService.items;

  openWishlist(): void {
    this.wishlistService.open();
  }

  closeWishlist(): void {
    this.wishlistService.close();
  }

  removeFromWishlist(productId: string): void {
    this.wishlistService.remove(productId);
  }

  // PRODUCTOS
  private readonly requestedProductId = signal<string | null>(null);

  readonly products = signal<ApiProduct[]>([]);
  readonly product = signal<ApiProduct | null>(null);
  readonly relatedSelection = signal<ApiProduct[]>([]);

  readonly selectedPriceType = signal<TipoPrecioVisual>('Detal');
  readonly quantity = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly cartTotalItems = this.cartService.totalItems;

  // OPCIONES DE PRECIO
  readonly priceOptions = computed<ProductPriceOption[]>(() => {
    const product = this.product();

    if (!product) return [];

    const types: {
      type: TipoPrecioVisual;
      productType: ProductPriceType;
      label: string;
      moneda: 'BCV' | 'Divisas';
    }[] = [
      {
        type: 'DetalBCV',
        productType: 'Detal',
        label: 'Detal',
        moneda: 'BCV'
      },
      {
        type: 'Detal',
        productType: 'Detal',
        label: 'Detal',
        moneda: 'Divisas'
      },
      {
        type: 'Mayor',
        productType: 'Mayor',
        label: 'Mayor',
        moneda: 'Divisas'
      },
      {
        type: 'GranMayor',
        productType: 'GranMayor',
        label: 'Gran Mayor',
        moneda: 'Divisas'
      }
    ];

    return types.map(({ type, productType, label, moneda }) => {
      const productPrice = product.precios.find(
        price => price.tipo_precio === productType
      );

      return {
        type,
        label,
        moneda,
        price: Number(
          productPrice?.precio_final ??
          productPrice?.precio ??
          0
        ),
        available: Boolean(productPrice)
      };
    });
  });

  readonly selectedPrice = computed(() => {
    const option = this.priceOptions().find(
      price => price.type === this.selectedPriceType()
    );

    return option?.price ?? 0;
  });

  readonly selectedPriceLabel = computed(() => {
    const option = this.priceOptions().find(
      price => price.type === this.selectedPriceType()
    );

    return option
      ? `${option.label} (${option.moneda})`
      : '';
  });

  readonly relatedProducts = computed(() => this.relatedSelection());

  // INICIALIZACIÓN
  ngOnInit(): void {
    const state = window.history.state as {
      productId?: string;
    };

    this.requestedProductId.set(state?.productId ?? null);
    this.loadProducts();
  }

  // CARGAR PRODUCTOS
  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productService.getProducts().subscribe({
      next: response => {
        this.products.set(response.data);

        const requestedId = this.requestedProductId();

        const requestedProduct = requestedId
          ? response.data.find(product => product.id === requestedId)
          : undefined;

        const fallbackProduct =
          response.data.find(
            product => product.estado && Number(product.stock) > 0
          ) ?? response.data[0];

        const productToShow = requestedProduct ?? fallbackProduct;

        if (!productToShow) {
          this.errorMessage.set('No hay productos disponibles.');
          this.loading.set(false);
          return;
        }

        this.selectProduct(productToShow.id);
        this.loading.set(false);
      },

      error: error => {
        console.error('Error al cargar detalle de producto:', error);
        this.errorMessage.set('No se pudo cargar el producto.');
        this.loading.set(false);
      }
    });
  }

  // SELECCIONAR PRODUCTO
  selectProduct(productId: string): void {
    const product = this.products().find(
      item => item.id === productId
    );

    if (!product) return;

    this.product.set(product);
    this.quantity.set(1);

    const possibleRelated = this.products().filter(
      item =>
        item.id !== product.id &&
        Number(item.stock) > 0 &&
        item.estado
    );

    this.relatedSelection.set(
      this.getRandomProducts(possibleRelated, 5)
    );

    this.selectedPriceType.set('Detal');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // PRECIOS
  selectPrice(type: TipoPrecioVisual): void {
    if (type !== 'DetalBCV' && type !== 'Detal') return;

    const option = this.priceOptions().find(
      price => price.type === type
    );

    if (!option?.available) return;

    this.selectedPriceType.set(type);
  }

  // CANTIDAD
  decreaseQuantity(): void {
    this.quantity.update(current => Math.max(1, current - 1));
  }

  increaseQuantity(): void {
    const product = this.product();
    if (!product) return;

    const stock = Number(product.stock);

    this.quantity.update(current =>
      Math.min(stock, current + 1)
    );
  }

  setQuantity(value: string | number): void {
    const product = this.product();
    if (!product) return;

    const stock = Number(product.stock);
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      this.quantity.set(1);
      return;
    }

    this.quantity.set(
      Math.min(stock, Math.max(1, Math.floor(parsed)))
    );
  }

  // CARRITO
  addToCart(): void {
    const product = this.product();
    if (!product) return;

    const stock = Number(product.stock);
    if (stock <= 0) return;

    const tipoPrecio = this.selectedPriceType();

    this.cartService.add(
      {
        id: product.id,
        name: product.nombre,
        price: this.selectedPrice(),
        stock,
        imageUrl: product.imagen_url,
        priceType: tipoPrecio === 'DetalBCV'
          ? 'Detal'
          : tipoPrecio
      },
      this.quantity()
    );
  }

  goToCart(): void {
    this.cartService.open();
  }

  // PRODUCTOS RELACIONADOS
  getRelatedPrice(product: ApiProduct): number {
    const mayor = product.precios.find(
      price => price.tipo_precio === 'Mayor'
    );

    return Number(
      mayor?.precio_final ??
      mayor?.precio ??
      0
    );
  }

  private getRandomProducts(
    products: ApiProduct[],
    amount: number
  ): ApiProduct[] {
    const shuffled = [...products];

    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(
        Math.random() * (index + 1)
      );

      [shuffled[index], shuffled[randomIndex]] =
        [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, amount);
  }

  // STOCK
  getStockLabel(product: ApiProduct): string {
    const stock = Number(product.stock);

    if (stock <= 0) return 'Agotado';
    if (stock <= 5) return `Últimas ${stock}`;

    return 'Disponible';
  }

  getSeverity(
    product: ApiProduct
  ): 'success' | 'warn' | 'danger' {
    const stock = Number(product.stock);

    if (stock <= 0) return 'danger';
    if (stock <= 5) return 'warn';

    return 'success';
  }
}
