
import { CommonModule } from '@angular/common';
import { BcvService } from '../../services/bcv.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
    DestroyRef,

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
import { CartPrices, CartService } from '../../services/cart';

import {
  ApiProduct,
  ProductPriceType,
  ProductService
} from '../../services/product.service';

type TipoPrecioVisual = 'DetalBCV' | ProductPriceType;

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
    FormsModule,
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

  private readonly destroyRef = inject(DestroyRef);

  private readonly pedidoService = inject(PedidoService);

readonly mostrarPedidoDirecto = signal(false);
readonly enviandoPedidoDirecto = signal(false);
readonly errorPedidoDirecto = signal('');

readonly totalPedidoDirecto = computed(
  () => this.selectedPrice() * this.quantity()
);

pedidoDirecto = {
  nombre_completo: '',
  telefono: '',
  correo: '',
  sede: '',
  direccion_base: '',
  tipo_entrega: '',
  detalles_entrega: '',
  metodo_pago: '',
};

abrirPedidoDirecto(): void {
  const producto = this.product();

  if (!producto || Number(producto.stock) <= 0) {
    return;
  }

  this.errorPedidoDirecto.set('');
  this.mostrarPedidoDirecto.set(true);
}

cerrarPedidoDirecto(): void {
  if (this.enviandoPedidoDirecto()) return;

  this.mostrarPedidoDirecto.set(false);
}

confirmarPedidoDirecto(): void {
  const producto = this.product();
  const datos = this.pedidoDirecto;

  if (!producto || this.enviandoPedidoDirecto()) return;

  if (
    !datos.nombre_completo.trim() ||
    !datos.telefono.trim() ||
    !datos.correo.trim() ||
    !datos.sede.trim() ||
    !datos.direccion_base.trim() ||
    !datos.tipo_entrega ||
    !datos.metodo_pago
  ) {
    this.errorPedidoDirecto.set(
      'Completa todos los campos obligatorios.'
    );
    return;
  }

  const pedido = {
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
    items: [
      {
        producto_id: producto.id,
        cantidad: this.quantity(),
      },
    ],
  };

  this.enviandoPedidoDirecto.set(true);
  this.errorPedidoDirecto.set('');

  this.pedidoService.crearPedido(pedido).subscribe({
    next: (response) => {
      this.enviandoPedidoDirecto.set(false);

      const whatsappUrl = response.data?.whatsappUrl;

      if (!whatsappUrl) {
        this.errorPedidoDirecto.set(
          'El pedido se procesó, pero no se recibió el enlace de WhatsApp.'
        );
        return;
      }

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      this.mostrarPedidoDirecto.set(false);
    },
    error: (error) => {
      this.enviandoPedidoDirecto.set(false);
      console.error('Error al crear pedido directo:', error);

      this.errorPedidoDirecto.set(
        error.error?.message || 'No se pudo confirmar el pedido.'
      );
    },
  });
}

  private readonly productService = inject(ProductService);
  private readonly bcvService = inject(BcvService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  // AUTENTICACIÓN Y PERMISOS
  readonly authService = inject(AuthService);

  readonly canAccessAdmin = computed(() =>
    this.authService.user()?.tipo?.trim().toUpperCase() === 'ADMIN'
  );

  // PRESUPUESTOS: SOLO FUERZA DE VENTAS
readonly canAccessPresupuestos = computed(() => {
  const rol = this.authService.user()?.tipo?.trim().toUpperCase();

  return rol === 'F_VENTAS';
});

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
readonly tasaBCV = signal<number | null>(null);

formatearBCV(precioUSD: number): string {
  const tasa = this.tasaBCV();

  if (
    tasa === null ||
    !Number.isFinite(tasa) ||
    tasa <= 0 ||
    !Number.isFinite(precioUSD)
  ) {
    return 'No disponible';
  }

  return (precioUSD * tasa).toLocaleString('es-VE', {
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

 readonly selectedPriceType = signal<TipoPrecioVisual>('DetalBCV');
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
    productType: 'detal_bs',
    label: 'Detal',
    moneda: 'BCV'
  },
  {
    type: 'detal_usd',
    productType: 'detal_usd',
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
    this.bcvService.getRate()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe({
    next: tasa => {
      this.tasaBCV.set(tasa);
    },
    error: error => {
      console.error('Error al obtener tasa BCV:', error);
      this.tasaBCV.set(null);
    }
  });
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

  this.selectedPriceType.set('DetalBCV');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // PRECIOS
  selectPrice(type: TipoPrecioVisual): void {
 if (type !== 'DetalBCV' && type !== 'detal_usd') return;

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

  const prices: Partial<Record<
    'detal_bs' | 'detal_usd' | 'Mayor' | 'GranMayor',
    number
  >> = {};

  for (const item of product.precios) {
    const price = Number(
      item.precio_final ?? item.precio
    );

    if (Number.isFinite(price)) {
      prices[item.tipo_precio] = price;
    }
  }

  const tipoPrecio = this.selectedPriceType();

  this.cartService.add(
    {
      id: product.id,
      name: product.nombre,
      price: this.selectedPrice(),
      stock,
      imageUrl: product.imagen_url,
      priceType:
        tipoPrecio === 'DetalBCV'
          ? 'detal_bs'
          : tipoPrecio,
      prices,
    },
    this.quantity()
  );
}


  // PRODUCTOS RELACIONADOS
  
getRelatedPrice(product: ApiProduct): number {
  const precio = product.precios.find(
    item => item.tipo_precio === 'detal_bs'
  );

  return Number(precio?.precio_final ?? precio?.precio ?? 0);
}



addRelatedToCart(product: ApiProduct): void {
  const stock = Number(product.stock);
  if (stock <= 0) return;

  const prices: CartPrices = {};

  for (const item of product.precios ?? []) {
    const price = Number(item.precio_final ?? item.precio);

    if (Number.isFinite(price)) {
      prices[item.tipo_precio] = price;
    }
  }

  this.cartService.add({
    id: product.id,
    name: product.nombre,
    price: prices.detal_bs ?? prices.detal_usd ?? 0,
    stock,
    imageUrl: product.imagen_url,
    priceType: 'detal_bs',
    prices,
  });

  this.cartService.open();
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
