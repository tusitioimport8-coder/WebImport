import { CurrencyPipe } from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  CartService,
} from '../../services/cart';

import {
  Carrito,
} from '../../shared/components/carrito/carrito';


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
    RouterLink,

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

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Catalogo
  implements OnInit {

  private readonly productService =
    inject(ProductService);


  private readonly cartService =
    inject(CartService);


  readonly pageSize = 8;


  readonly products =
    signal<CatalogProduct[]>([]);


  readonly searchTerm =
    signal('');


  readonly selectedCategory =
    signal('Todas');


  readonly selectedSort =
    signal<CatalogSort>(
      'price-asc',
    );


  readonly pageIndex =
    signal(0);


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal<string | null>(
      null,
    );


  /*
   * ========================================
   * CARRITO
   * ========================================
   */

  readonly cartTotalItems =
    this.cartService.totalItems;


  readonly sortOptions:
    ReadonlyArray<{
      value: CatalogSort;
      label: string;
    }> = [

    {
      value: 'price-asc',
      label:
        'Precio: menor a mayor',
    },

    {
      value: 'price-desc',
      label:
        'Precio: mayor a menor',
    },

    {
      value: 'name-asc',
      label:
        'Nombre: A–Z',
    },
  ];


  /*
   * ========================================
   * CATEGORÍAS
   * ========================================
   */

  readonly categories =
    computed<readonly string[]>(
      () => {

        const categories =
          new Set(
            this.products()
              .filter(
                (product) =>
                  product.quantity > 0,
              )
              .map(
                (product) =>
                  product.category,
              ),
          );


        return [
          'Todas',

          ...Array.from(
            categories,
          ).sort(
            (a, b) =>
              a.localeCompare(
                b,
                'es',
                {
                  sensitivity:
                    'base',
                },
              ),
          ),
        ];
      },
    );


  /*
   * ========================================
   * FILTRADO
   * ========================================
   */

  readonly filteredProducts =
    computed<CatalogProduct[]>(
      () => {

        const search =
          this.normalizeText(
            this.searchTerm(),
          );


        const category =
          this.selectedCategory();


        const sort =
          this.selectedSort();


        const filtered =
          this.products().filter(
            (product) => {

              /*
               * En catálogo solamente mostramos
               * productos con existencia.
               */

              if (
                product.quantity <= 0
              ) {

                return false;
              }


              const normalizedName =
                this.normalizeText(
                  product.name,
                );


              const normalizedDescription =
                this.normalizeText(
                  product.description,
                );


              const matchesSearch =
                !search ||
                normalizedName.includes(
                  search,
                ) ||
                normalizedDescription.includes(
                  search,
                );


              const matchesCategory =
                category ===
                  'Todas' ||
                product.category ===
                  category;


              return (
                matchesSearch &&
                matchesCategory
              );
            },
          );


        return [
          ...filtered,
        ].sort(
          (a, b) =>
            this.compareProducts(
              a,
              b,
              sort,
            ),
        );
      },
    );


  /*
   * ========================================
   * PAGINACIÓN
   * ========================================
   */

  readonly pageCount =
    computed(() => {

      return Math.ceil(
        this.filteredProducts()
          .length /
          this.pageSize,
      );
    });


  readonly currentPageIndex =
    computed(() => {

      const totalPages =
        this.pageCount();


      if (
        totalPages === 0
      ) {

        return 0;
      }


      return Math.min(
        this.pageIndex(),
        totalPages - 1,
      );
    });


  readonly visibleProducts =
    computed(() => {

      const start =
        this.currentPageIndex() *
        this.pageSize;


      const end =
        start +
        this.pageSize;


      return this
        .filteredProducts()
        .slice(
          start,
          end,
        );
    });


  /*
   * ========================================
   * ESTADO DE LA VISTA
   * ========================================
   */

  readonly viewState =
    computed<CatalogViewState>(
      () => {

        if (
          this.loading()
        ) {

          return 'loading';
        }


        if (
          this.errorMessage()
        ) {

          return 'error';
        }


        if (
          this.products()
            .length === 0
        ) {

          return 'empty';
        }


        if (
          this.filteredProducts()
            .length === 0
        ) {

          return 'no-results';
        }


        return 'content';
      },
    );


  ngOnInit(): void {

    this.loadProducts();
  }


  /*
   * ========================================
   * PRODUCTOS
   * ========================================
   */

  loadProducts(): void {

    this.loading.set(
      true,
    );


    this.errorMessage.set(
      null,
    );


    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Respuesta completa de productos:',
            response,
          );


          console.log(
            'Productos recibidos:',
            response.data,
          );


          console.table(
            response.data,
          );


          response.data.forEach(
            (
              product,
              index,
            ) => {

              console.log(
                `Producto ${index + 1}:`,
                product,
              );
            },
          );


          const products =
            response.data.map(
              (product) =>
                this.mapApiProduct(
                  product,
                ),
            );


          this.products.set(
            products,
          );


          this.loading.set(
            false,
          );
        },


        error: (error) => {

          console.error(
            'Error al cargar productos:',
            error,
          );


          this.errorMessage.set(
            'No se pudieron cargar los productos.',
          );


          this.loading.set(
            false,
          );
        },
      });
  }


  /*
   * ========================================
   * FILTROS
   * ========================================
   */

  onSearchChange(
    value: string,
  ): void {

    this.searchTerm.set(
      value,
    );


    this.resetPage();
  }


  onCategoryChange(
    value: string,
  ): void {

    this.selectedCategory.set(
      value,
    );


    this.resetPage();
  }


  onSortChange(
    value: string,
  ): void {

    this.selectedSort.set(
      value as CatalogSort,
    );


    this.resetPage();
  }


  onPageChange(
    index: number,
  ): void {

    const lastPage =
      Math.max(
        0,
        this.pageCount() - 1,
      );


    this.pageIndex.set(
      Math.max(
        0,

        Math.min(
          index,
          lastPage,
        ),
      ),
    );
  }


  /*
   * ========================================
   * CARRITO
   * ========================================
   */

  addToCart(
    product: CatalogProduct,
  ): void {

    /*
     * Catálogo utiliza actualmente
     * el precio Mayor.
     */

    this.cartService.add(
      {
        id:
          product.id,

        name:
          product.name,

        price:
          product.price,

        stock:
          product.quantity,

        imageUrl:
          product.imageUrl,

        priceType:
          'Mayor',
      },
      1,
    );
  }


  getQuantityInCart(
    productId: string,
  ): number {

    return this
      .cartService
      .getQuantity(
        productId,
        'Mayor',
      );
  }


  openCart(): void {

    this.cartService.open();
  }


  /*
   * ========================================
   * MAPEO
   * ========================================
   */

  private mapApiProduct(
    product: ApiProduct,
  ): CatalogProduct {

    console.log(
      `Precios de ${product.nombre}:`,
      product.precios,
    );


    console.table(
      product.precios,
    );


    const mayor =
      product.precios.find(
        (price) =>

          price.tipo_precio
            ?.trim()
            .toLowerCase() ===
          'mayor',
      );


    console.log(
      `Precio Mayor encontrado para ${product.nombre}:`,
      mayor,
    );


    const price =
      Number(
        mayor?.precio_final ??
        mayor?.precio ??
        0,
      );


    return {
      id:
        product.id,

      name:
        product.nombre,

      category:
        'Sin categoría',

      price,

      quantity:
        Number(
          product.stock,
        ),

      description:
        product.descripcion ??
        '',

      imageUrl:
        product.imagen_url,
    };
  }


  /*
   * ========================================
   * ORDENAMIENTO
   * ========================================
   */

  private compareProducts(
    a: CatalogProduct,
    b: CatalogProduct,
    sort: CatalogSort,
  ): number {

    switch (sort) {

      case 'price-asc':

        return (
          a.price -
          b.price
        );


      case 'price-desc':

        return (
          b.price -
          a.price
        );


      case 'name-asc':

        return a.name.localeCompare(
          b.name,
          'es',
          {
            sensitivity:
              'base',
          },
        );


      default:

        return 0;
    }
  }


  /*
   * ========================================
   * UTILIDADES
   * ========================================
   */

  private normalizeText(
    value: string,
  ): string {

    return value
      .trim()
      .toLocaleLowerCase(
        'es',
      );
  }


  private resetPage(): void {

    this.pageIndex.set(
      0,
    );
  }
}