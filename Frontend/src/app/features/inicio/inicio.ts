
import { CommonModule } from '@angular/common';
import { forkJoin} from 'rxjs';
import {
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';


import { switchMap, map } from 'rxjs';
import { AuthService } from '../../services/auth';
import {
  BannerService,
  BannerImage
} from '../../services/banner.service';
import { TuiButton, TuiIcon, TuiInput, TuiTextfield } from '@taiga-ui/core';

import { ApiProduct, ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist.service';

import { Carrito } from '../../shared/components/carrito/carrito';
import { Wishlist } from '../../shared/components/wishlist/wishlist';
import { SiteHeader } from '../../shared/components/site-header/site-header';
import { MiPerfil } from '../../shared/components/mi-perfil/mi-perfil';
import { SiteFooter } from '../../shared/components/site-footer/site-footer';

export interface HomeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category?: string;
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
    TuiButton,
    TuiIcon,
    TuiInput,
    MiPerfil,
    TuiTextfield,
    Wishlist,
    Carrito,
    SiteHeader,
    SiteFooter
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.less'
})
export class Inicio implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  private readonly bannerService = inject(BannerService);
readonly authService = inject(AuthService);

readonly uploadingBanner = signal(false);
readonly bannerError = signal<string | null>(null);

private bannerImages: BannerImage[] = [];

readonly canEditBanners = computed(
  () => this.authService.user()?.tipo === 'MARKETING'
);
  readonly perfilAbierto = signal(false);

abrirPerfil(): void {
  this.perfilAbierto.set(true);
}

cerrarPerfil(): void {
  this.perfilAbierto.set(false);
}

  readonly wishlistService = inject(WishlistService);

  @ViewChild('featuredCarousel')
  private featuredCarousel?: ElementRef<HTMLElement>;

  @ViewChild('categoryCarousel')
  private categoryCarousel?: ElementRef<HTMLElement>;

  @ViewChild('newestCarousel')
  private newestCarousel?: ElementRef<HTMLElement>;

  @ViewChild('recommendedCarousel')
  private recommendedCarousel?: ElementRef<HTMLElement>;

  @ViewChild('valueCarousel')
  private valueCarousel?: ElementRef<HTMLElement>;

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  readonly products = signal<HomeProduct[]>([]);
  readonly featuredSelection = signal<HomeProduct[]>([]);
  readonly recommendedSelection = signal<HomeProduct[]>([]);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly promoImage1 = signal<string | null>(null);
  readonly promoImage2 = signal<string | null>(null);

  imagenesBanner1 = signal<BannerImage[]>([]);
imagenesBanner2 = signal<BannerImage[]>([]);

indiceBanner1 = signal(0);
indiceBanner2 = signal(0);

private intervaloBanners?: ReturnType<typeof setInterval>;

  readonly cartTotalItems = this.cartService.totalItems;
  readonly wishlistOpen = this.wishlistService.isOpen;
  readonly wishlistProducts = this.wishlistService.items;
  readonly wishlistTotalItems = this.wishlistService.totalItems;

  readonly categories: readonly HomeCategory[] = [
    {
      label: 'Electrónica',
      icon: 'pi pi-desktop',
      image:
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&q=80'
    },
    {
      label: 'Accesorios',
      icon: 'pi pi-shopping-bag',
      image:
        'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=900&q=80'
    },
    {
      label: 'Hogar',
      icon: 'pi pi-home',
      image:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80'
    },
    {
      label: 'Oficina',
      icon: 'pi pi-briefcase',
      image:
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80'
    },
    {
      label: 'Novedades',
      icon: 'pi pi-star',
      image:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80'
    },
    {
      label: 'Todos',
      icon: 'pi pi-th-large',
      image:
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=900&q=80'
    }
  ];

  readonly availableProducts = computed(() =>
    this.products().filter(product => product.quantity > 0)
  );

  readonly filteredProducts = computed(() =>
    this.filterBySearch(this.availableProducts())
  );

  readonly featuredProducts = computed(() =>
    this.filterBySearch(this.featuredSelection())
  );

  readonly newestProducts = computed(() =>
    this.filteredProducts().slice(0, 8)
  );

  readonly recommendedProducts = computed(() =>
    this.filterBySearch(this.recommendedSelection())
  );

  readonly valueProducts = computed(() =>
    [...this.filteredProducts()]
      .sort((a, b) => a.price - b.price)
      .slice(0, 10)
  );

  constructor() {
    effect(() => {
      const overlayOpen =
        this.wishlistOpen() || this.cartService.isOpen();

      document.documentElement.classList.toggle(
        'overlay-open',
        overlayOpen
      );

      document.body.classList.toggle(
        'overlay-open',
        overlayOpen
      );
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadBanners();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    if (this.intervaloBanners) {
  clearInterval(this.intervaloBanners);
}
  }
loadBanners(): void {
  this.bannerService.getBanner('home-principal').subscribe({
    next: response => {
      const imagenes = response.data?.activo
        ? (response.data.imagenes ?? []).filter(
            (img): img is BannerImage => !!img?.objectKey && !!img?.publicUrl
          )
        : [];

      this.imagenesBanner1.set(imagenes);
      this.promoImage1.set(imagenes[0]?.publicUrl ?? null);

      console.log('[BANNER 1] Imágenes cargadas:', imagenes.length);
    },
    error: error => {
      if (error.status !== 404) {
        console.error('[BANNER 1] Error:', error);
      }
    }
  });

  this.bannerService.getBanner('home-secundario').subscribe({
    next: response => {
      const imagenes = response.data?.activo
        ? (response.data.imagenes ?? []).filter(
            (img): img is BannerImage => !!img?.objectKey && !!img?.publicUrl
          )
        : [];

      this.imagenesBanner2.set(imagenes);
      this.promoImage2.set(imagenes[0]?.publicUrl ?? null);

      console.log('[BANNER 2] Imágenes cargadas:', imagenes.length);
    },
    error: error => {
      if (error.status !== 404) {
        console.error('[BANNER 2] Error:', error);
      }
    }
  });

  this.iniciarCarruselBanners();
}
private iniciarCarruselBanners(): void {
  if (this.intervaloBanners) {
    clearInterval(this.intervaloBanners);
  }

  this.indiceBanner1.set(0);
  this.indiceBanner2.set(0);

  this.intervaloBanners = setInterval(() => {
    const total1 = this.imagenesBanner1().length;
    const total2 = this.imagenesBanner2().length;

    if (total1 > 1) {
      this.indiceBanner1.update(indice => (indice + 1) % total1);
    }

    if (total2 > 1) {
      this.indiceBanner2.update(indice => (indice + 1) % total2);
    }
  }, 4000);
}

  // PRODUCTOS
  loadProducts(): void {
    this.stopAutoplay();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productService.getProducts().subscribe({
      next: response => {
        this.updateProducts(
          response.data.map(product =>
            this.mapApiProduct(product)
          )
        );
      },
      error: error => {
        console.error(
          'Error al cargar productos en Inicio:',
          error
        );

        this.errorMessage.set(
          'No pudimos cargar los productos.'
        );

        this.loading.set(false);
      }
    });
  }


  private updateProducts(products: HomeProduct[]): void {
    this.products.set(products);

    const available = products.filter(
      product => product.quantity > 0
    );

    const featured = this.getRandomProducts(
      available,
      10
    );

    this.featuredSelection.set(featured);

    const featuredIds = new Set(
      featured.map(product => product.id)
    );

    const remaining = available.filter(
      product => !featuredIds.has(product.id)
    );

    this.recommendedSelection.set(
      this.getRandomProducts(
        remaining.length ? remaining : available,
        10
      )
    );

    this.loading.set(false);
    setTimeout(() => this.startAutoplay(), 0);
  }

  // BÚSQUEDA
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  // PROMOCIONES
onPromoImageChange(event: Event, promo: 1 | 2): void {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);

  input.value = '';

  if (!files.length || !this.canEditBanners() || this.uploadingBanner()) {
    return;
  }

  const tiposPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (files.some(file => !tiposPermitidos.includes(file.type))) {
    this.bannerError.set('Selecciona solo imágenes JPG, PNG, WEBP o GIF.');
    return;
  }

  const identificador =
    promo === 1 ? 'home-principal' : 'home-secundario';

  this.bannerError.set(null);
  this.uploadingBanner.set(true);

  // Cada imagen obtiene su URL firmada y se sube a S3.
  const subidas = files.map(file =>
    this.bannerService.requestUploadUrl(file).pipe(
      switchMap(response => {
        if (!response.success || !response.data) {
          throw new Error(`No se pudo preparar la subida de ${file.name}`);
        }

        const { uploadUrl, publicUrl, objectKey } = response.data;

        return this.bannerService.uploadImage(uploadUrl, file).pipe(
          map(() => ({ objectKey, publicUrl }))
        );
      })
    )
  );

  // Espera a que TODAS las imágenes terminen de subirse.
  forkJoin(subidas).pipe(
    switchMap(imagenes => {
      console.log('[BANNERS] Guardando lote:', {
        identificador,
        cantidad: imagenes.length,
        imagenes
      });

      return this.bannerService.saveBanner(identificador, imagenes).pipe(
        map(response => ({ response, imagenes }))
      );
    })
  ).subscribe({
    next: ({ response, imagenes }) => {
      if (!response.success) {
        this.bannerError.set('No se pudo guardar el lote de imágenes.');
        this.uploadingBanner.set(false);
        return;
      }

      // Mientras implementamos el carrusel, mostramos la primera.
  const imagenesGuardadas = (response.data?.imagenes ?? []).filter(
  (img): img is BannerImage => !!img?.objectKey && !!img?.publicUrl
);

if (promo === 1) {
  this.imagenesBanner1.set(imagenesGuardadas);
  this.promoImage1.set(imagenesGuardadas[0]?.publicUrl ?? null);
} else {
  this.imagenesBanner2.set(imagenesGuardadas);
  this.promoImage2.set(imagenesGuardadas[0]?.publicUrl ?? null);
}

this.iniciarCarruselBanners();

      console.log(
        `[BANNERS] ${imagenes.length} imágenes guardadas en ${identificador}`
      );

      this.uploadingBanner.set(false);
    },

    error: error => {
      console.error('[BANNERS] Error en subida múltiple:', error);
      this.bannerError.set(
        'No se pudieron subir o guardar todas las imágenes.'
      );
      this.uploadingBanner.set(false);
    }
  });
}
  // CARRITO
  addToCart(product: HomeProduct): void {
    this.cartService.add(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.quantity,
        imageUrl: product.imageUrl,
        priceType: 'Mayor'
      },
      1
    );
  }

  openCart(): void {
    this.cartService.open();
  }

  // LISTA DE DESEOS
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

  toggleWishlist(productId: string): void {
    const product = this.products().find(
      item => item.id === productId
    );

    if (!product) return;

    this.wishlistService.toggle({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.quantity,
      imageUrl: product.imageUrl,
      priceType: 'Mayor'
    });
  }

  // CARRUSELES
  scrollCarousel(
    carousel: HTMLElement,
    direction: -1 | 1
  ): void {
    this.startAutoplay();
    this.moveCarousel(carousel, direction);
  }

  startAutoplay(): void {
    this.stopAutoplay();

    this.autoplayTimer = setInterval(
      () => this.moveAllCarousels(),
      2500
    );
  }

  stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  private moveAllCarousels(): void {
    const carousels = [
      this.featuredCarousel?.nativeElement,
      this.categoryCarousel?.nativeElement,
      this.newestCarousel?.nativeElement,
      this.recommendedCarousel?.nativeElement,
      this.valueCarousel?.nativeElement
    ];

    carousels.forEach(carousel => {
      if (carousel) {
        this.moveCarousel(carousel, 1);
      }
    });
  }

  private moveCarousel(
    carousel: HTMLElement,
    direction: -1 | 1
  ): void {
    const distance = carousel.clientWidth / 3;
    const maxScroll =
      carousel.scrollWidth - carousel.clientWidth;

    if (maxScroll <= 0) return;

    if (direction === 1) {
      if (
        carousel.scrollLeft + distance >=
        maxScroll - 4
      ) {
        carousel.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
        return;
      }

      carousel.scrollBy({
        left: distance,
        behavior: 'smooth'
      });
      return;
    }

    if (carousel.scrollLeft <= 4) {
      carousel.scrollTo({
        left: maxScroll,
        behavior: 'smooth'
      });
      return;
    }

    carousel.scrollBy({
      left: -distance,
      behavior: 'smooth'
    });
  }

  // STOCK
  getStockLabel(product: HomeProduct): string {
    if (product.quantity <= 0) return 'Agotado';

    if (product.quantity <= 5) {
      return `Últimas ${product.quantity}`;
    }

    return 'Disponible';
  }

  getSeverity(
    product: HomeProduct
  ): 'success' | 'warn' | 'danger' {
    if (product.quantity <= 0) return 'danger';
    if (product.quantity <= 5) return 'warn';
    return 'success';
  }

  // MAPEO DEL BACKEND
  private mapApiProduct(
    product: ApiProduct
  ): HomeProduct {
    const mayor = product.precios?.find(
      price =>
        price.tipo_precio?.trim().toLowerCase() ===
        'mayor'
    );

    return {
      id: product.id,
      name: product.nombre,
      description: product.descripcion ?? '',
      price: Number(
        mayor?.precio_final ?? mayor?.precio ?? 0
      ),
      quantity: Number(product.stock ?? 0),
      imageUrl: product.imagen_url,
      category:
        product.categorias
          ?.map(categoria => categoria.nombre)
          .join(', ') || 'Sin categoría'
    };
  }

  // SELECCIÓN ALEATORIA
  private getRandomProducts(
    products: HomeProduct[],
    amount: number
  ): HomeProduct[] {
    const shuffled = [...products];

    for (
      let index = shuffled.length - 1;
      index > 0;
      index--
    ) {
      const randomIndex = Math.floor(
        Math.random() * (index + 1)
      );

      [
        shuffled[index],
        shuffled[randomIndex]
      ] = [
        shuffled[randomIndex],
        shuffled[index]
      ];
    }

    return shuffled.slice(0, amount);
  }

  // FILTRO
  private filterBySearch(
    products: HomeProduct[]
  ): HomeProduct[] {
    const search = this.normalizeText(
      this.searchTerm()
    );

    if (!search) return products;

    return products.filter(
      product =>
        this.normalizeText(product.name).includes(
          search
        ) ||
        this.normalizeText(
          product.description
        ).includes(search) ||
        this.normalizeText(
          product.category ?? ''
        ).includes(search)
    );
  }

  private normalizeText(value: string): string {
    return value.trim().toLocaleLowerCase('es');
  }
}
