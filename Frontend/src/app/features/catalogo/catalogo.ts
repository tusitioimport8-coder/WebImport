import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

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

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  imageUrl?: string;
}

export type CatalogSort =
  | 'relevance'
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
    FormsModule,

    TuiBadge,
    TuiButton,
    TuiIcon,
    TuiInput,
    TuiLoader,
    TuiPagination,
    TuiTextfield,
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalogo {
  readonly pageSize = 8;

  /*
   * Aquí posteriormente puedes cargar los productos
   * desde el mismo servicio/API que utilice Inventario.
   *
   * Lo dejamos vacío por ahora para que aparezca
   * correctamente el estado "Próximamente".
   */
  readonly products = signal<CatalogProduct[]>([]);

  readonly cart = signal<Record<string, number>>({});

  readonly searchTerm = signal('');
  readonly selectedCategory = signal('Todas');
  readonly selectedSort = signal<CatalogSort>('relevance');
  readonly pageIndex = signal(0);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly sortOptions: ReadonlyArray<{
    value: CatalogSort;
    label: string;
  }> = [
    {
      value: 'relevance',
      label: 'Relevancia',
    },
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

  readonly categories = computed<readonly string[]>(() => {
    const categories = new Set(
      this.products()
        .filter((product) => product.quantity > 0)
        .map((product) => product.category),
    );

    return [
      'Todas',
      ...Array.from(categories).sort((a, b) =>
        a.localeCompare(b, 'es', {
          sensitivity: 'base',
        }),
      ),
    ];
  });

  readonly filteredProducts = computed<CatalogProduct[]>(() => {
    const search = this.normalizeText(this.searchTerm());
    const category = this.selectedCategory();
    const sort = this.selectedSort();

    const filtered = this.products().filter((product) => {
      /*
       * El catálogo del cliente solo debe mostrar
       * productos disponibles.
       */
      if (product.quantity <= 0) {
        return false;
      }

      const normalizedName = this.normalizeText(product.name);
      const normalizedDescription = this.normalizeText(
        product.description,
      );

      const matchesSearch =
        !search ||
        normalizedName.includes(search) ||
        normalizedDescription.includes(search);

      const matchesCategory =
        category === 'Todas' ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) =>
      this.compareProducts(a, b, sort),
    );
  });

  readonly pageCount = computed(() => {
    return Math.ceil(
      this.filteredProducts().length / this.pageSize,
    );
  });

  readonly currentPageIndex = computed(() => {
    const totalPages = this.pageCount();

    if (totalPages === 0) {
      return 0;
    }

    return Math.min(
      this.pageIndex(),
      totalPages - 1,
    );
  });

  readonly visibleProducts = computed(() => {
    const start =
      this.currentPageIndex() * this.pageSize;

    const end =
      start + this.pageSize;

    return this.filteredProducts().slice(
      start,
      end,
    );
  });

  readonly cartTotalItems = computed(() => {
    return Object.values(this.cart()).reduce(
      (total, quantity) => total + quantity,
      0,
    );
  });

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

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.resetPage();
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.resetPage();
  }

  onSortChange(value: string): void {
    this.selectedSort.set(value as CatalogSort);
    this.resetPage();
  }

  onPageChange(index: number): void {
    const lastPage = Math.max(
      0,
      this.pageCount() - 1,
    );

    this.pageIndex.set(
      Math.max(
        0,
        Math.min(index, lastPage),
      ),
    );
  }

  addToCart(product: CatalogProduct): void {
    this.cart.update((currentCart) => {
      const currentQuantity =
        currentCart[product.id] ?? 0;

      if (currentQuantity >= product.quantity) {
        return currentCart;
      }

      return {
        ...currentCart,
        [product.id]: currentQuantity + 1,
      };
    });
  }

  getQuantityInCart(productId: string): number {
    return this.cart()[productId] ?? 0;
  }

  private compareProducts(
    a: CatalogProduct,
    b: CatalogProduct,
    sort: CatalogSort,
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
          {
            sensitivity: 'base',
          },
        );

      case 'relevance':
      default:
        return 0;
    }
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('es');
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }
}