import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inventario } from './inventario';

describe('Inventario', () => {
  let component: Inventario;
  let fixture: ComponentFixture<Inventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventario],
    }).compileComponents();

    fixture = TestBed.createComponent(Inventario);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create with typed mock products and summary values', () => {
    expect(component).toBeTruthy();
    expect(component.products()).toHaveLength(10);
    expect(component.summary().lowStockProducts).toBe(3);
    expect(component.summary().outOfStockProducts).toBe(2);
    expect(component.summary().estimatedValue).toBeGreaterThan(0);
  });

  it('should filter products by SKU', () => {
    component.searchTerm.set('CAM-003');

    expect(component.filteredProducts()).toHaveLength(1);
    expect(component.filteredProducts()[0]?.name).toBe('Cámara web Full HD');
  });

  it('should add a local product and calculate its stock status', () => {
    component.openCreate();
    component.productForm.setValue({
      name: 'Soporte para portátil',
      sku: 'ACC-SOP-011',
      category: 'Accesorios',
      price: 25,
      quantity: 2,
      minimumStock: 3,
      description: 'Soporte ajustable de prueba.',
    });

    component.saveProduct();

    const created = component.products().find((product) => product.sku === 'ACC-SOP-011');
    expect(component.products()).toHaveLength(11);
    expect(created?.status).toBe('low-stock');
  });

  it('should edit a product and recalculate the summary', () => {
    const product = component.products()[0];

    expect(product).toBeDefined();
    if (!product) {
      return;
    }

    const initialOutOfStock = component.summary().outOfStockProducts;
    component.openEdit(product);
    component.productForm.patchValue({ quantity: 0 });
    component.saveProduct();

    const updated = component.products().find((item) => item.id === product.id);
    expect(updated?.status).toBe('out-of-stock');
    expect(component.summary().outOfStockProducts).toBe(initialOutOfStock + 1);
  });

  it('should reject negative numeric values', () => {
    component.openCreate();
    component.productForm.patchValue({
      name: 'Producto inválido',
      sku: 'INVALID-001',
      price: -1,
      quantity: -1,
      minimumStock: -1,
    });

    component.saveProduct();

    expect(component.productForm.invalid).toBe(true);
    expect(component.products()).toHaveLength(10);
  });
});
