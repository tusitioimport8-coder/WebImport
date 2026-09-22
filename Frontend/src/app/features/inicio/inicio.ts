import { CommonModule } from '@angular/common';

import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Tag } from 'primeng/tag';

import {
  TuiButton,
  TuiIcon,
  TuiInput,
  TuiTextfield,
} from '@taiga-ui/core';

import { TuiCardLarge } from '@taiga-ui/layout';

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


export interface HomeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}


export interface HomeCategory {
  label: string;
  icon: string;
  image: string;
}


@Component({
  selector: 'app-inicio',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,

    Tag,

    TuiButton,
    TuiCardLarge,
    TuiIcon,
    TuiInput,
    TuiTextfield,

    Carrito,
  ],

  templateUrl: './inicio.html',
  styleUrl: './inicio.less',
})
export class Inicio
  implements OnInit, OnDestroy {

  private readonly productService =
    inject(ProductService);

  private readonly cartService =
    inject(CartService);


  /*
   * Referencias a los carruseles definidos
   * actualmente en inicio.html.
   */

  @ViewChild('featuredCarousel')
  private featuredCarousel?:
    ElementRef<HTMLElement>;


  @ViewChild('categoryCarousel')
  private categoryCarousel?:
    ElementRef<HTMLElement>;


  @ViewChild('newestCarousel')
  private newestCarousel?:
    ElementRef<HTMLElement>;


  @ViewChild('recommendedCarousel')
  private recommendedCarousel?:
    ElementRef<HTMLElement>;


  @ViewChild('valueCarousel')
  private valueCarousel?:
    ElementRef<HTMLElement>;


  /*
   * Timer general de autoplay.
   *
   * Cada 2.5 segundos avanzamos.
   */

  private autoplayTimer:
    ReturnType<typeof setInterval> | null =
      null;


  readonly products =
    signal<HomeProduct[]>([]);


  readonly featuredSelection =
    signal<HomeProduct[]>([]);


  readonly recommendedSelection =
    signal<HomeProduct[]>([]);


  readonly loading =
    signal(false);


  readonly errorMessage =
    signal<string | null>(null);


  readonly searchTerm =
    signal('');


  /*
   * Wishlist sigue siendo local por ahora.
   *
   * Más adelante también podrá convertirse
   * en un servicio compartido.
   */

  readonly wishlist =
    signal<Set<string>>(
      new Set(),
    );


  /*
   * El contador del carrito ahora viene
   * directamente del CartService global.
   */

  readonly cartTotalItems =
    this.cartService.totalItems;


  /*
   * Las categorías siguen siendo manuales.
   */

  readonly categories:
    readonly HomeCategory[] = [

    {
      label: 'Electrónica',

      icon:
        'pi pi-desktop',

      image:
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&q=80',
    },

    {
      label: 'Accesorios',

      icon:
        'pi pi-shopping-bag',

      image:
        'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=900&q=80',
    },

    {
      label: 'Hogar',

      icon:
        'pi pi-home',

      image:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80',
    },

    {
      label: 'Oficina',

      icon:
        'pi pi-briefcase',

      image:
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80',
    },

    {
      label: 'Novedades',

      icon:
        'pi pi-star',

      image:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80',
    },

    {
      label: 'Todos',

      icon:
        'pi pi-th-large',

      image:
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&q=80',
    },
  ];


  readonly availableProducts =
    computed(() =>

      this.products().filter(
        (product) =>
          product.quantity > 0,
      ),
    );


  readonly filteredProducts =
    computed(() => {

      return this.filterBySearch(
        this.availableProducts(),
      );
    });


  /*
   * "Para ti" se selecciona aleatoriamente
   * una sola vez cuando cargamos.
   */

  readonly featuredProducts =
    computed(() => {

      return this.filterBySearch(
        this.featuredSelection(),
      );
    });


  /*
   * La API devuelve productos ordenados
   * por creado_en DESC.
   */

  readonly newestProducts =
    computed(() =>

      this.filteredProducts()
        .slice(0, 8),
    );


  readonly recommendedProducts =
    computed(() => {

      return this.filterBySearch(
        this.recommendedSelection(),
      );
    });


  readonly valueProducts =
    computed(() => {

      return [
        ...this.filteredProducts(),
      ]
        .sort(
          (first, second) =>
            first.price -
            second.price,
        )
        .slice(
          0,
          10,
        );
    });


  readonly wishlistTotalItems =
    computed(
      () =>
        this.wishlist().size,
    );


  ngOnInit(): void {

    this.loadProducts();
  }


  ngOnDestroy(): void {

    this.stopAutoplay();
  }


  /*
   * ========================================
   * PRODUCTOS
   * ========================================
   */

  loadProducts(): void {

    /*
     * Evita crear varios intervals.
     */

    this.stopAutoplay();


    this.loading.set(true);

    this.errorMessage.set(null);


    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

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


          const available =
            products.filter(
              (product) =>
                product.quantity > 0,
            );


          /*
           * Selección aleatoria
           * para "Para ti".
           */

          const featured =
            this.getRandomProducts(
              available,
              10,
            );


          this.featuredSelection.set(
            featured,
          );


          /*
           * Recomendados intenta no repetir
           * exactamente Para ti.
           */

          const featuredIds =
            new Set(
              featured.map(
                (product) =>
                  product.id,
              ),
            );


          const remaining =
            available.filter(
              (product) =>
                !featuredIds.has(
                  product.id,
                ),
            );


          this.recommendedSelection.set(

            this.getRandomProducts(

              remaining.length > 0
                ? remaining
                : available,

              10,
            ),
          );


          console.log(
            'Productos cargados en Inicio:',
            response.data,
          );


          console.log(
            'Selección aleatoria Para ti:',
            featured,
          );


          this.loading.set(false);


          /*
           * Esperamos a que Angular renderice
           * antes de comenzar el autoplay.
           */

          setTimeout(
            () => {

              this.startAutoplay();
            },
            0,
          );
        },


        error: (error) => {

          console.error(
            'Error al cargar productos en Inicio:',
            error,
          );


          this.errorMessage.set(
            'No pudimos cargar los productos.',
          );


          this.loading.set(false);
        },
      });
  }


  /*
   * ========================================
   * BÚSQUEDA
   * ========================================
   */

  onSearchChange(
    value: string,
  ): void {

    this.searchTerm.set(
      value,
    );
  }


  /*
   * ========================================
   * CARRITO
   * ========================================
   */

  addToCart(
    product: HomeProduct,
  ): void {

    /*
     * Inicio está mostrando temporalmente
     * el precio Mayor.
     *
     * Por eso cualquier producto añadido
     * desde Inicio entra como Mayor.
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


  openCart(): void {

    this.cartService.open();
  }


  /*
   * ========================================
   * LISTA DE DESEOS
   * ========================================
   */

  toggleWishlist(
    productId: string,
  ): void {

    this.wishlist.update(
      (current) => {

        const updated =
          new Set(current);


        if (
          updated.has(
            productId,
          )
        ) {

          updated.delete(
            productId,
          );

        } else {

          updated.add(
            productId,
          );
        }


        return updated;
      },
    );
  }


  isInWishlist(
    productId: string,
  ): boolean {

    return this.wishlist()
      .has(
        productId,
      );
  }


  /*
   * ========================================
   * CARRUSELES
   * ========================================
   */

  scrollCarousel(
    carousel: HTMLElement,
    direction: -1 | 1,
  ): void {

    /*
     * Al tocar manualmente las flechas,
     * reiniciamos los 2.5 segundos.
     */

    this.startAutoplay();


    this.moveCarousel(
      carousel,
      direction,
    );
  }


  startAutoplay(): void {

    this.stopAutoplay();


    this.autoplayTimer =
      setInterval(
        () => {

          this.moveAllCarousels();
        },
        2500,
      );
  }


  stopAutoplay(): void {

    if (
      this.autoplayTimer
    ) {

      clearInterval(
        this.autoplayTimer,
      );


      this.autoplayTimer =
        null;
    }
  }


  private moveAllCarousels(): void {

    const carousels = [

      this.featuredCarousel
        ?.nativeElement,

      this.categoryCarousel
        ?.nativeElement,

      this.newestCarousel
        ?.nativeElement,

      this.recommendedCarousel
        ?.nativeElement,

      this.valueCarousel
        ?.nativeElement,
    ];


    carousels.forEach(
      (carousel) => {

        if (
          carousel
        ) {

          this.moveCarousel(
            carousel,
            1,
          );
        }
      },
    );
  }


  private moveCarousel(
    carousel: HTMLElement,
    direction: -1 | 1,
  ): void {

    const distance =
      carousel.clientWidth / 3;


    const maxScroll =
      carousel.scrollWidth -
      carousel.clientWidth;


    if (
      maxScroll <= 0
    ) {

      return;
    }


    /*
     * AVANZAR
     */

    if (
      direction === 1
    ) {

      const nextPosition =
        carousel.scrollLeft +
        distance;


      if (
        nextPosition >=
        maxScroll - 4
      ) {

        carousel.scrollTo(
          {
            left: 0,

            behavior:
              'smooth',
          },
        );


        return;
      }


      carousel.scrollBy(
        {
          left:
            distance,

          behavior:
            'smooth',
        },
      );


      return;
    }


    /*
     * RETROCEDER
     */

    if (
      carousel.scrollLeft <= 4
    ) {

      carousel.scrollTo(
        {
          left:
            maxScroll,

          behavior:
            'smooth',
        },
      );


      return;
    }


    carousel.scrollBy(
      {
        left:
          -distance,

        behavior:
          'smooth',
      },
    );
  }


  /*
   * ========================================
   * STOCK
   * ========================================
   */

  getStockLabel(
    product: HomeProduct,
  ): string {

    if (
      product.quantity <= 0
    ) {

      return 'Agotado';
    }


    if (
      product.quantity <= 5
    ) {

      return (
        `Últimas ${product.quantity}`
      );
    }


    return 'Disponible';
  }


  getSeverity(
    product: HomeProduct,
  ):
    | 'success'
    | 'warn'
    | 'danger' {

    if (
      product.quantity <= 0
    ) {

      return 'danger';
    }


    if (
      product.quantity <= 5
    ) {

      return 'warn';
    }


    return 'success';
  }


  /*
   * ========================================
   * MAPEO DEL BACKEND
   * ========================================
   */

  private mapApiProduct(
    product: ApiProduct,
  ): HomeProduct {

    /*
     * Temporalmente mostramos Mayor
     * porque Detal tiene datos
     * incorrectos en BD.
     */

    const mayor =
      product.precios.find(
        (price) =>

          price.tipo_precio
            ?.trim()
            .toLowerCase() ===
          'mayor',
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

      description:
        product.descripcion ??
        '',

      price,

      quantity:
        Number(
          product.stock,
        ),

      imageUrl:
        product.imagen_url,
    };
  }


  /*
   * ========================================
   * PRODUCTOS ALEATORIOS
   * ========================================
   */

  private getRandomProducts(
    products: HomeProduct[],
    amount: number,
  ): HomeProduct[] {

    const shuffled =
      [...products];


    for (
      let index =
        shuffled.length - 1;

      index > 0;

      index--
    ) {

      const randomIndex =
        Math.floor(
          Math.random() *
          (index + 1),
        );


      [
        shuffled[index],
        shuffled[randomIndex],
      ] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }


    return shuffled.slice(
      0,
      amount,
    );
  }


  /*
   * ========================================
   * FILTRO DE BÚSQUEDA
   * ========================================
   */

  private filterBySearch(
    products: HomeProduct[],
  ): HomeProduct[] {

    const search =
      this.normalizeText(
        this.searchTerm(),
      );


    if (
      !search
    ) {

      return products;
    }


    return products.filter(
      (product) => {

        const name =
          this.normalizeText(
            product.name,
          );


        const description =
          this.normalizeText(
            product.description,
          );


        return (
          name.includes(
            search,
          ) ||

          description.includes(
            search,
          )
        );
      },
    );
  }


  private normalizeText(
    value: string,
  ): string {

    return value
      .trim()
      .toLocaleLowerCase(
        'es',
      );
  }
}