import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { of } from 'rxjs';

import {
  ProductService,
} from '../../services/product.service';

import {
  DetalleProducto,
} from './detalle-producto';

describe('DetalleProducto', () => {
  let component: DetalleProducto;

  let fixture:
    ComponentFixture<DetalleProducto>;

  const productServiceMock = {
    getProducts: () =>
      of({
        success: true,
        data: [],
      }),
  };

  beforeEach(async () => {
    await TestBed
      .configureTestingModule({
        imports: [
          DetalleProducto,
        ],

        providers: [
          {
            provide:
              ProductService,

            useValue:
              productServiceMock,
          },
        ],
      })
      .compileComponents();

    fixture =
      TestBed.createComponent(
        DetalleProducto,
      );

    component =
      fixture.componentInstance;

    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(
      component,
    ).toBeTruthy();
  });
});