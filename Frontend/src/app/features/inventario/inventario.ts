import { CommonModule } from '@angular/common';
import { switchMap, map, of, finalize, forkJoin, catchError } from 'rxjs';
import { ProductPayload } from '../../services/product.service';
import { AuthService } from '../../services/auth';
import { BcvService } from '../../services/bcv.service';
import { DestroyRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDialog, TuiIcon, TuiInput, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiPagination, TuiTextarea } from '@taiga-ui/kit';
import { Tag } from 'primeng/tag';


import {
  InventoryCategory,
  InventoryEditorMode,
  InventoryFilters,
  InventoryFormValue,
  InventoryProduct,
  InventorySort,
  InventoryStatus,
  InventorySummary,
} from './inventario.models';

import {
  ApiProduct,
  ProductService,
} from '../../services/product.service';

import {
  ApiCategory,
  CategoryService,
} from '../../services/category.service';

type InventoryViewState = 'loading' | 'error' | 'empty' | 'no-results' | 'content';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Tag,
    TuiButton,
    TuiCardLarge,
    TuiDialog,
    TuiIcon,
    TuiInput,
    TuiLoader,
    TuiPagination,
    TuiTextarea,
  ],
  templateUrl: './inventario.html',
  styleUrl: './inventario.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inventario implements OnInit {

  private readonly productService = inject(ProductService);
  private readonly bcvService = inject(BcvService);
private readonly destroyRef = inject(DestroyRef);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);

readonly isMarketing = computed(
  () => this.authService.user()?.tipo === 'MARKETING'
);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private nextProductSequence = 1;

  readonly categories = signal<ApiCategory[]>([]);
  readonly tasaBCV = signal<number | null>(null);

formatearBCV(precioUSD: number): string {
  const tasa = this.tasaBCV();

  if (tasa === null || !Number.isFinite(precioUSD)) {
    return 'No disponible';
  }

  return this.bcvService
    .convertirABolivares(precioUSD, tasa)
    .toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
}
  readonly pageSize = 5;
  readonly statusLabels: Record<InventoryStatus, string> = {
    available: 'Disponible',
    'low-stock': 'Poco stock',
    'out-of-stock': 'Agotado',
  };
  readonly statusFilterOptions: ReadonlyArray<{
    value: InventoryStatus | 'Todos';
    label: string;
  }> = [
    { value: 'Todos', label: 'Todos los estados' },
    { value: 'available', label: 'Disponible' },
    { value: 'low-stock', label: 'Poco stock' },
    { value: 'out-of-stock', label: 'Agotado' },
  ];
  readonly sortOptions: ReadonlyArray<{ value: InventorySort; label: string }> = [
    { value: 'name-asc', label: 'Nombre: A–Z' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'stock-asc', label: 'Menor existencia' },
  ];

 readonly products = signal<InventoryProduct[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<InventoryCategory | 'Todas'>('Todas');
  readonly selectedStatus = signal<InventoryStatus | 'Todos'>('Todos');
  readonly selectedSort = signal<InventorySort>('name-asc');
  readonly pageIndex = signal(0);
  readonly editorMode = signal<InventoryEditorMode>('create');
  readonly editingProductId = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly selectedImage = signal<string | null>(null);
  readonly selectedImageFile = signal<File | null>(null);
readonly savingProduct = signal(false);
  readonly previewStatus = signal<InventoryStatus>('out-of-stock');

  editorOpen = false;

  readonly productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    category: this.formBuilder.control<InventoryCategory>('Electrónica', Validators.required),
   price: [0, [Validators.required, Validators.min(0)]],
priceBCV: [0, [Validators.required, Validators.min(0)]],
wholesalePrice: [0, [Validators.required, Validators.min(0)]],
bulkPrice: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    description: ['', Validators.maxLength(300)],
  });
loadProducts(): void {
  this.loading.set(true);
  this.errorMessage.set(null);

  this.productService.getProducts().pipe(
    switchMap((response) => {
      if (!response.data.length) {
        return of([] as ApiProduct[]);
      }

      return forkJoin(
        response.data.map((product) =>
          this.productService.getProductById(product.id).pipe(
            map((detail) => detail.data),
            catchError(() => of(product))
          )
        )
      );
    })
  ).subscribe({
    next: (products) => {
      this.products.set(
        products.map((product) => this.mapApiProduct(product))
      );

      this.loading.set(false);
    },

    error: (error) => {
      console.error('Error al cargar inventario:', error);

      this.errorMessage.set(
        'No se pudieron cargar los productos.'
      );

      this.loading.set(false);
    },
  });
}

loadCategories(): void {
  this.categoryService.getCategories().subscribe({
    next: (categories) => {
      this.categories.set(categories);
    },
    error: (error) => {
      console.error('Error al cargar categorías:', error);
      this.categories.set([]);
    },
  });
}

  readonly filters = computed<InventoryFilters>(() => ({
    search: this.searchTerm(),
    category: this.selectedCategory(),
    status: this.selectedStatus(),
    sort: this.selectedSort(),
  }));

  readonly summary = computed<InventorySummary>(() => {
    const products = this.products();

    return {
      totalProducts: products.length,
      lowStockProducts: products.filter((product) => product.status === 'low-stock').length,
      outOfStockProducts: products.filter((product) => product.status === 'out-of-stock').length,
      estimatedValue: products.reduce(
        (total, product) => total + product.price * product.quantity,
        0,
      ),
    };
  });

  readonly filteredProducts = computed<InventoryProduct[]>(() => {
    const filters = this.filters();
    const query = this.normalizeText(filters.search);
    const filtered = this.products().filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.category].some((value) =>
          this.normalizeText(value).includes(query),
        );
      const matchesCategory = filters.category === 'Todas' || product.category === filters.category;
      const matchesStatus = filters.status === 'Todos' || product.status === filters.status;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    return [...filtered].sort((first, second) => this.compareProducts(first, second, filters.sort));
  });

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)),
  );
  readonly currentPageIndex = computed(() => Math.min(this.pageIndex(), this.pageCount() - 1));
  readonly visibleProducts = computed(() => {
    const start = this.currentPageIndex() * this.pageSize;

    return this.filteredProducts().slice(start, start + this.pageSize);
  });
  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();

    return (
      filters.search.trim().length > 0 ||
      filters.category !== 'Todas' ||
      filters.status !== 'Todos' ||
      filters.sort !== 'name-asc'
    );
  });
  readonly viewState = computed<InventoryViewState>(() => {
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
  readonly editorTitle = computed(() => {
    switch (this.editorMode()) {
      case 'create':
        return 'Agregar producto';
      case 'edit':
        return 'Editar producto';
      case 'view':
        return 'Detalle del producto';
    }
  });
  readonly editorReadOnly = computed(() => this.editorMode() === 'view');

  constructor() {
    this.productForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.previewStatus.set(
        this.resolveStatus(Number(value.quantity ?? 0), Number(value.minimumStock ?? 0)),
      );
    });
  }

ngOnInit(): void {
  this.loadProducts();
  this.loadCategories();

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

  onSearch(event: Event): void {
    this.searchTerm.set(this.getEventValue(event));
    this.resetPage();
  }

  onCategoryChange(event: Event): void {
    const value = this.getEventValue(event);

    if (value === 'Todas' || this.isInventoryCategory(value)) {
      this.selectedCategory.set(value);
      this.resetPage();
    }
  }

  onStatusChange(event: Event): void {
    const value = this.getEventValue(event);

    if (value === 'Todos' || this.isInventoryStatus(value)) {
      this.selectedStatus.set(value);
      this.resetPage();
    }
  }

  onSortChange(event: Event): void {
    const value = this.getEventValue(event);

    if (this.isInventorySort(value)) {
      this.selectedSort.set(value);
      this.resetPage();
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('Todas');
    this.selectedStatus.set('Todos');
    this.selectedSort.set('name-asc');
    this.resetPage();
  }

  onPageChange(index: number): void {
    this.pageIndex.set(Math.max(0, Math.min(index, this.pageCount() - 1)));
  }
onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    console.error('El archivo seleccionado no es una imagen');
    return;
  }

  this.selectedImageFile.set(file);

  const reader = new FileReader();

  reader.onload = () => {
    this.selectedImage.set(reader.result as string);
  };

  reader.readAsDataURL(file);
}
  openCreate(): void {
    if (this.isMarketing()) return;
    this.prepareEditor('create');
    this.productForm.reset({
      name: '',
      category: 'Electrónica',
     price: 0,
priceBCV: 0,
wholesalePrice: 0,
bulkPrice: 0,
      quantity: 0,
      minimumStock: 0,
      description: '',
    });
    this.selectedImage.set(null);
    this.previewStatus.set('out-of-stock');
    this.editorOpen = true;
  }

  openView(product: InventoryProduct): void {
    this.prepareEditor('view', product);
    this.populateForm(product);
    this.productForm.disable({ emitEvent: false });
    this.editorOpen = true;
  }

openEdit(product: InventoryProduct): void {
  this.prepareEditor('edit', product);
  this.populateForm(product);

  if (this.isMarketing()) {
    this.productForm.disable({ emitEvent: false });
  }

  this.editorOpen = true;
}

  closeEditor(): void {
    this.editorOpen = false;
    this.submitted.set(false);
  }

saveProduct(): void {
  if (this.editorReadOnly() || this.savingProduct()) {
    return;
  }

  if (this.isMarketing()) {
    const editingId = this.editingProductId();
    const file = this.selectedImageFile();

    if (!editingId || !file) {
      return;
    }

    this.savingProduct.set(true);

    this.productService.getProductUploadUrl(file).pipe(
      switchMap(response =>
        this.productService.uploadProductImage(
          response.data.uploadUrl,
          file
        ).pipe(
          map(() => response.data.publicUrl)
        )
      ),
      switchMap(imageUrl =>
        this.productService.updateProduct(editingId, {
          imagen_url: imageUrl
        })
      ),
      finalize(() => this.savingProduct.set(false))
    ).subscribe({
      next: () => {
        this.closeEditor();
        this.loadProducts();
      },
      error: error => {
        console.error('Error al actualizar imagen:', error);
        this.errorMessage.set('No se pudo actualizar la imagen.');
      }
    });

    return;
  }

  this.submitted.set(true);
  this.productForm.markAllAsTouched();

  if (this.productForm.invalid) {
    return;
  }

  const value = this.productForm.getRawValue();
  const categoryId = this.categories().find(
  category => category.nombre === value.category
)?.id;
  const editingId = this.editingProductId();
  const file = this.selectedImageFile();

  this.savingProduct.set(true);

  const image$ = file
    ? this.productService.getProductUploadUrl(file).pipe(
        switchMap((response) =>
          this.productService
            .uploadProductImage(response.data.uploadUrl, file)
            .pipe(map(() => response.data.publicUrl))
        )
      )
    : of(
    editingId
      ? this.products().find(product => product.id === editingId)?.imageUrl ?? ''
      : ''
  );

  image$
    .pipe(
      switchMap((imageUrl) => {
        const payload: ProductPayload = {
          nombre: value.name.trim(),
          descripcion: value.description.trim(),
          imagen_url: imageUrl,
          stock: Number(value.quantity),
categorias_ids: categoryId !== undefined ? [String(categoryId)] : [],
       precios: [
  {
    tipo_precio: 'detal_usd',
    precio: Number(value.price)
  },
  {
    tipo_precio: 'detal_bs',
    precio: Number(value.priceBCV)
  },
  {
    tipo_precio: 'Mayor',
    precio: Number(value.wholesalePrice)
  },
  {
    tipo_precio: 'GranMayor',
    precio: Number(value.bulkPrice)
  }
]
        };

      console.log('MODO:', editingId ? 'EDITAR' : 'CREAR');
console.log('ARCHIVO:', file?.name ?? 'SIN ARCHIVO');
console.log('URL DE IMAGEN:', imageUrl);
console.log('PAYLOAD DEL PRODUCTO:', payload);

if (editingId) {
  return this.productService.updateProduct(editingId, payload);
}

return this.productService.createProduct(payload).pipe(
  switchMap((response) => {
    if (!imageUrl) {
      return of(response);
    }

    return this.productService.updateProduct(
      response.data.id,
      { imagen_url: imageUrl }
    );
  })
);
      }),
      finalize(() => this.savingProduct.set(false))
    )
    .subscribe({
      next: () => {
        this.closeEditor();
        this.resetPage();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al guardar producto:', error);
        this.errorMessage.set(
          'No se pudo guardar el producto. Revisa la consola.'
        );
      }
    });
}

retry(): void {
  this.loadProducts();
}

  isFieldInvalid(controlName: keyof InventoryFormValue): boolean {
    const control = this.productForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  hasFieldError(controlName: keyof InventoryFormValue, errorName: string): boolean {
    const control = this.productForm.controls[controlName];

    return control.hasError(errorName) && (control.touched || this.submitted());
  }

  statusLabel(status: InventoryStatus): string {
    return this.statusLabels[status];
  }

  statusSeverity(status: InventoryStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'available':
        return 'success';
      case 'low-stock':
        return 'warn';
      case 'out-of-stock':
        return 'danger';
    }
  }

  productInitial(product: InventoryProduct): string {
    return product.name.charAt(0).toLocaleUpperCase('es');
  }

  pageRangeStart(): number {
    return this.filteredProducts().length === 0 ? 0 : this.currentPageIndex() * this.pageSize + 1;
  }

  pageRangeEnd(): number {
    return Math.min((this.currentPageIndex() + 1) * this.pageSize, this.filteredProducts().length);
  }

  private prepareEditor(mode: InventoryEditorMode, product?: InventoryProduct): void {
    this.selectedImageFile.set(null);
    this.productForm.enable({ emitEvent: false });
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    this.editorMode.set(mode);
    this.editingProductId.set(product?.id ?? null);
    this.submitted.set(false);
  }

  private mapApiProduct(product: ApiProduct): InventoryProduct {
 const getPrice = (
  type: 'detal_usd' | 'detal_bs' | 'Mayor' | 'GranMayor'
): number => {
    const found = product.precios?.find(
      (price) =>
        price.tipo_precio?.trim().toLowerCase() ===
        type.toLowerCase()
    );

    return Number(
      found?.precio_final ?? found?.precio ?? 0
    );
  };

  const quantity = Number(product.stock ?? 0);
  const minimumStock = 5;

  return {
    id: product.id,
    name: product.nombre,
    category: (
  product.categorias?.map((categoria) => categoria.nombre).join(', ')
  || 'Sin categoría'
) as InventoryCategory,
   price: getPrice('detal_usd'),
priceBCV: getPrice('detal_bs'),
wholesalePrice: getPrice('Mayor'),
bulkPrice: getPrice('GranMayor'),
    quantity,
    minimumStock,
    status: this.resolveStatus(quantity, minimumStock),
    description: product.descripcion ?? '',
    imageUrl: product.imagen_url,
  };
}

  private populateForm(product: InventoryProduct): void {
    this.productForm.reset({
      name: product.name,
      category: product.category,
     price: product.price,
priceBCV: product.priceBCV,
wholesalePrice: product.wholesalePrice,
bulkPrice: product.bulkPrice,
      quantity: product.quantity,
      minimumStock: product.minimumStock,
      description: product.description,
    });
    this.selectedImage.set(product.imageUrl ?? null);
    this.previewStatus.set(product.status);
  }

  private toProductData(value: InventoryFormValue): Omit<InventoryProduct, 'id'> {
    const quantity = Number(value.quantity);
    const minimumStock = Number(value.minimumStock);

    return {
      name: value.name.trim(),
      category: value.category,
    price: Number(value.price),
priceBCV: Number(value.priceBCV),
wholesalePrice: Number(value.wholesalePrice),
bulkPrice: Number(value.bulkPrice),
      quantity,
      minimumStock,
      status: this.resolveStatus(quantity, minimumStock),
      description: value.description.trim(),
      ...(this.selectedImage() ? { imageUrl: this.selectedImage()! } : {}),
    };
  }

  private resolveStatus(quantity: number, minimumStock: number): InventoryStatus {
    if (quantity <= 0) {
      return 'out-of-stock';
    }

    return quantity <= minimumStock ? 'low-stock' : 'available';
  }

  private compareProducts(
    first: InventoryProduct,
    second: InventoryProduct,
    sort: InventorySort,
  ): number {
    switch (sort) {
      case 'name-asc':
        return first.name.localeCompare(second.name, 'es', { sensitivity: 'base' });
      case 'price-asc':
        return first.price - second.price;
      case 'price-desc':
        return second.price - first.price;
      case 'stock-asc':
        return first.quantity - second.quantity;
    }
  }

  private normalizeText(value: string): string {
    return value.trim().toLocaleLowerCase('es');
  }

  private getEventValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

 private isInventoryCategory(value: string): value is InventoryCategory {
  return this.categories().some(
    category => category.nombre === value
  );
}

  private isInventoryStatus(value: string): value is InventoryStatus {
    return value === 'available' || value === 'low-stock' || value === 'out-of-stock';
  }

  private isInventorySort(value: string): value is InventorySort {
    return (
      value === 'name-asc' ||
      value === 'price-asc' ||
      value === 'price-desc' ||
      value === 'stock-asc'
    );
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }
}
