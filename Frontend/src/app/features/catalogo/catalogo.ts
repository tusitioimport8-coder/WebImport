
import { CurrencyPipe } from '@angular/common';

import { DecimalPipe } from '@angular/common';
import { BcvService } from '../../services/bcv.service';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { MiPerfil } from '../../shared/components/mi-perfil/mi-perfil';

import { from, of } from 'rxjs';
import { catchError, map, mergeMap, toArray } from 'rxjs/operators';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

import {
  TuiButton,
  TuiIcon,
  TuiInput,
  TuiLoader,
  TuiTextfield,
} from '@taiga-ui/core';

import {
  TuiBadge,
  TuiPagination,
} from '@taiga-ui/kit';

import {
  ApiProduct,
  ProductService,
} from '../../services/product.service';

import {
  ApiCategory,
  CategoryService,
} from '../../services/category.service';

import { ActivatedRoute } from '@angular/router';

import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist.service';

import { Carrito } from '../../shared/components/carrito/carrito';
import { Wishlist } from '../../shared/components/wishlist/wishlist';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';
export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  priceBCV: number;
  quantity: number;
  description: string;
  imageUrl?: string;
}
export type CatalogSort =
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

export type CatalogViewState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'no-results'
  | 'content';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
  CurrencyPipe,
  DecimalPipe,
  FormsModule,
  RouterLink,
  Wishlist,
  MiPerfil,
  SiteHeader,
  SiteFooter,
  TuiBadge,
  TuiButton,
  TuiIcon,
  TuiInput,
  TuiLoader,
  TuiPagination,
  TuiTextfield,
  Carrito,
],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalogo implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);

  private readonly route = inject(ActivatedRoute);

  private readonly bcvService = inject(BcvService);

readonly tasaBCV = signal<number | null>(null);

getPrecioBCV(precioUSD: number): number | null {
  const tasa = this.tasaBCV();

  if (tasa === null || !Number.isFinite(precioUSD)) {
    return null;
  }

  return this.bcvService.convertirABolivares(precioUSD, tasa);
}

  readonly authService = inject(AuthService);

readonly isAuthenticated = computed(() =>
  !!this.authService.user()
);

readonly canAccessAdmin = computed(() => {
  const rol = this.authService.user()?.tipo?.trim().toUpperCase();

  return rol === 'ADMIN';
});

// PRESUPUESTOS: SOLO FUERZA DE VENTAS
readonly canAccessPresupuestos = computed(() => {
  const rol = this.authService.user()?.tipo?.trim().toUpperCase();

  return rol === 'F_VENTAS';
});

// PANEL MI PERFIL
readonly perfilAbierto = signal(false);

abrirPerfil(): void {
  this.perfilAbierto.set(true);
}

cerrarPerfil(): void {
  this.perfilAbierto.set(false);
}

readonly canAccessInventory = computed(() => {
  const rol = this.authService.user()?.tipo?.trim().toUpperCase();

  return rol === 'ADMIN' || rol === 'MARKETING';
});

  readonly wishlistService = inject(WishlistService);

  readonly pageSize = 12;

  readonly products = signal<CatalogProduct[]>([]);
  readonly apiCategories = signal<ApiCategory[]>([]);

  readonly searchTerm = signal('');
  readonly selectedCategory = signal('Todas');
  readonly selectedSort = signal<CatalogSort>('price-asc');
  readonly pageIndex = signal(0);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // CARRITO
  readonly cartTotalItems = this.cartService.totalItems;

  // FAVORITOS
  readonly wishlistTotalItems = this.wishlistService.totalItems;
  readonly wishlistOpen = this.wishlistService.isOpen;
  readonly wishlistProducts = this.wishlistService.items;

  // ORDENAMIENTO
  readonly sortOptions: ReadonlyArray<{
    value: CatalogSort;
    label: string;
  }> = [
    {
      value: 'price-asc',
      label: 'Precio: menor a mayor',
    },
    {
      value: 'price-desc',
      label: 'Precio: mayor a menor',
    },
    {
      value: 'name-asc',
      label: 'Nombre: A–Z',
    },
  ];

  // CATEGORÍAS REALES DEL BACKEND
  // Conservamos categories() como arreglo de strings
  // para que funcione con el HTML existente.
  
readonly categories = computed<readonly string[]>(() => {
  const names = this.apiCategories()
    .map(category => category.nombre.trim())
    .filter(Boolean);

  const uniqueNames = [...new Set(names)];

  uniqueNames.sort((a, b) =>
    a.localeCompare(b, 'es', {
      sensitivity: 'base'
    })
  );

  return ['Todas', ...uniqueNames];
});


  // FILTRADO
  readonly filteredProducts = computed<CatalogProduct[]>(() => {
    const search = this.normalizeText(this.searchTerm());
    const category = this.selectedCategory();
    const sort = this.selectedSort();

    const filtered = this.products().filter(product => {
      // En catálogo solo mostramos productos con stock.
      if (product.quantity <= 0) {
        return false;
      }

      const normalizedName = this.normalizeText(product.name);
      const normalizedDescription = this.normalizeText(
        product.description
      );

      const matchesSearch =
        !search ||
        normalizedName.includes(search) ||
        normalizedDescription.includes(search);

      // Esta comparación funcionará cuando el listado
      // de productos incluya su categoría.
   const matchesCategory =
  category === 'Todas' ||
  product.category
    .split(',')
    .map(name => name.trim())
    .includes(category);

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) =>
      this.compareProducts(a, b, sort)
    );
  });

  // PAGINACIÓN
  readonly pageCount = computed(() => {
    return Math.ceil(
      this.filteredProducts().length / this.pageSize
    );
  });

  readonly currentPageIndex = computed(() => {
    const totalPages = this.pageCount();

    if (totalPages === 0) {
      return 0;
    }

    return Math.min(
      this.pageIndex(),
      totalPages - 1
    );
  });

  readonly visibleProducts = computed(() => {
    const start = this.currentPageIndex() * this.pageSize;
    const end = start + this.pageSize;

    return this.filteredProducts().slice(start, end);
  });

  // ESTADO DE LA VISTA
  readonly viewState = computed<CatalogViewState>(() => {
    if (this.loading()) {
      return 'loading';
    }

    if (this.errorMessage()) {
      return 'error';
    }

    if (this.products().length === 0) {
      return 'empty';
    }

    if (this.filteredProducts().length === 0) {
      return 'no-results';
    }

    return 'content';
  });

 ngOnInit(): void {
  this.loadProducts();
  this.loadCategories();

  this.route.queryParamMap.subscribe(params => {
  const busqueda = params.get('buscar') ?? '';

  this.searchTerm.set(busqueda);
});

  this.bcvService.getRate().subscribe({
    next: tasa => this.tasaBCV.set(tasa),
    error: error => {
      console.error('Error al obtener tasa BCV:', error);
      this.tasaBCV.set(null);
    }
  });
}

loadCategories(): void {
  this.categoryService.getCategories().subscribe({
    next: categories => {
      this.apiCategories.set(categories);
    },

    error: error => {
      console.error(
        'Error al cargar categorías:',
        error
      );

      // Conservamos cualquier categoría ya cargada.
      // No borramos los datos por un fallo temporal.
    }
  });
}


loadProducts(): void {
  this.loading.set(true);
  this.errorMessage.set(null);

  this.productService.getProducts().subscribe({
    next: response => {
      const products = response.data ?? [];

      this.products.set(
        products.map(product =>
          this.mapApiProduct(product)
        )
      );

      this.loading.set(false);
    },

    error: error => {
      console.error(
        'Error al cargar productos del catálogo:',
        error
      );

      this.errorMessage.set(
        'No se pudieron cargar los productos.'
      );

      this.loading.set(false);
    }
  });
}


  // BÚSQUEDA
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.resetPage();
  }

  // CATEGORÍAS
  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.resetPage();
  }

  // ORDENAMIENTO
  onSortChange(value: string): void {
    this.selectedSort.set(value as CatalogSort);
    this.resetPage();
  }

  // PAGINACIÓN
  onPageChange(index: number): void {
    const lastPage = Math.max(
      0,
      this.pageCount() - 1
    );

    this.pageIndex.set(
      Math.max(0, Math.min(index, lastPage))
    );
  }

  // FAVORITOS
  openWishlist(): void {
    this.wishlistService.open();
  }

  closeWishlist(): void {
    this.wishlistService.close();
  }

  removeFromWishlist(productId: string): void {
    this.wishlistService.remove(productId);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.has(productId);
  }

  toggleWishlist(product: CatalogProduct): void {
    this.wishlistService.toggle({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.quantity,
      imageUrl: product.imageUrl,
      priceType: 'Mayor',
    });
  }

  // STOCK
  getStockLabel(product: CatalogProduct): string {
    return product.quantity <= 5
      ? `Últimas ${product.quantity}`
      : 'Disponible';
  }

  // CARRITO
  addToCart(product: CatalogProduct): void {
    this.cartService.add(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.quantity,
        imageUrl: product.imageUrl,
        priceType: 'Mayor',
      },
      1
    );
  }

  getQuantityInCart(productId: string): number {
    return this.cartService.getQuantity(
      productId,
      'Mayor'
    );
  }

  openCart(): void {
    this.cartService.open();
  }

  // MAPEO DEL BACKEND
 
private mapApiProduct(product: ApiProduct): CatalogProduct {
  const detalUsd = product.precios?.find(
    price => price.tipo_precio === 'detal_usd'
  );

  const detalBs = product.precios?.find(
    price => price.tipo_precio === 'detal_bs'
  );

  return {
    id: product.id,
    name: product.nombre,
    category: product.categorias
      ?.map(categoria => categoria.nombre)
      .join(', ') || 'Sin categoría',
    price: Number(detalUsd?.precio_final ?? detalUsd?.precio ?? 0),
    priceBCV: Number(detalBs?.precio_final ?? detalBs?.precio ?? 0),
    quantity: Number(product.stock ?? 0),
    description: product.descripcion ?? '',
    imageUrl: product.imagen_url,
  };
}


  // ORDENAMIENTO
  private compareProducts(
    a: CatalogProduct,
    b: CatalogProduct,
    sort: CatalogSort
  ): number {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price;

      case 'price-desc':
        return b.price - a.price;

      case 'name-asc':
        return a.name.localeCompare(
          b.name,
          'es',
          { sensitivity: 'base' }
        );

      default:
        return 0;
    }
  }

  // UTILIDADES
  private normalizeText(value: string): string {
    return value.trim().toLocaleLowerCase('es');
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }
}
