import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDialog, TuiIcon, TuiInput, TuiLoader } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiPagination, TuiTextarea } from '@taiga-ui/kit';
import { Tag } from 'primeng/tag';

import { INVENTORY_MOCK_PRODUCTS } from './inventario.mock';
import {
  INVENTORY_CATEGORIES,
  InventoryCategory,
  InventoryEditorMode,
  InventoryFilters,
  InventoryFormValue,
  InventoryProduct,
  InventorySort,
  InventoryStatus,
  InventorySummary,
} from './inventario.models';

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
export class Inventario {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private nextProductSequence = INVENTORY_MOCK_PRODUCTS.length + 1;

  readonly categories = INVENTORY_CATEGORIES;
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

  readonly products = signal<InventoryProduct[]>(
    INVENTORY_MOCK_PRODUCTS.map((product) => ({ ...product })),
  );
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
  readonly skuConflict = signal(false);
  readonly previewStatus = signal<InventoryStatus>('out-of-stock');

  editorOpen = false;

  readonly productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
    sku: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
    category: this.formBuilder.control<InventoryCategory>('Electrónica', Validators.required),
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    description: ['', Validators.maxLength(300)],
  });

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
        [product.name, product.sku, product.category].some((value) =>
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
      this.skuConflict.set(false);
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

  openCreate(): void {
    this.prepareEditor('create');
    this.productForm.reset({
      name: '',
      sku: '',
      category: 'Electrónica',
      price: 0,
      quantity: 0,
      minimumStock: 0,
      description: '',
    });
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
    this.editorOpen = true;
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.submitted.set(false);
    this.skuConflict.set(false);
  }

  saveProduct(): void {
    if (this.editorReadOnly()) {
      return;
    }

    this.submitted.set(true);
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      return;
    }

    const value = this.productForm.getRawValue();
    const normalizedSku = value.sku.trim().toLocaleLowerCase('es');
    const duplicateSku = this.products().some(
      (product) =>
        product.id !== this.editingProductId() &&
        product.sku.trim().toLocaleLowerCase('es') === normalizedSku,
    );

    if (duplicateSku) {
      this.skuConflict.set(true);
      return;
    }

    const productData = this.toProductData(value);
    const editingId = this.editingProductId();

    if (editingId) {
      this.products.update((products) =>
        products.map((product) =>
          product.id === editingId ? { ...product, ...productData } : product,
        ),
      );
    } else {
      const id = `product-${String(this.nextProductSequence).padStart(3, '0')}`;
      this.nextProductSequence += 1;
      this.products.update((products) => [{ id, ...productData }, ...products]);
    }

    this.resetPage();
    this.closeEditor();
  }

  retry(): void {
    this.errorMessage.set(null);
    this.loading.set(false);
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
    this.productForm.enable({ emitEvent: false });
    this.productForm.markAsPristine();
    this.productForm.markAsUntouched();
    this.editorMode.set(mode);
    this.editingProductId.set(product?.id ?? null);
    this.submitted.set(false);
    this.skuConflict.set(false);
  }

  private populateForm(product: InventoryProduct): void {
    this.productForm.reset({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      quantity: product.quantity,
      minimumStock: product.minimumStock,
      description: product.description,
    });
    this.previewStatus.set(product.status);
  }

  private toProductData(value: InventoryFormValue): Omit<InventoryProduct, 'id'> {
    const quantity = Number(value.quantity);
    const minimumStock = Number(value.minimumStock);

    return {
      name: value.name.trim(),
      sku: value.sku.trim().toLocaleUpperCase('es'),
      category: value.category,
      price: Number(value.price),
      quantity,
      minimumStock,
      status: this.resolveStatus(quantity, minimumStock),
      description: value.description.trim(),
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
    return (INVENTORY_CATEGORIES as readonly string[]).includes(value);
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
