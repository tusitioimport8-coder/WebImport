import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { of } from 'rxjs';

import {
  ProductService,
} from '../../services/product.service';

import { Inicio } from './inicio';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  const productServiceMock = {
    getProducts: () =>
      of({
        success: true,
        data: [],
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [
        {
          provide: ProductService,
          useValue: productServiceMock,
        },
      ],
    }).compileComponents();

    fixture =
      TestBed.createComponent(Inicio);

    component =
      fixture.componentInstance;

    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});