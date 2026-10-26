import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { Inicio } from './features/inicio/inicio';
import { Catalogo } from './features/catalogo/catalogo';
import { Inventario } from './features/inventario/inventario';
import { DetalleProducto } from './features/detalle-producto/detalle-producto';
import { Sesion } from './shared/components/sesion/sesion';
import { Admin } from './features/admin/admin';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'inicio', component: Inicio },
      { path: 'catalogo', component: Catalogo },
      { path: 'inventario', component: Inventario },
      { path: 'detalle-producto', component: DetalleProducto },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }, 
       { path: 'admin', component: Admin }
    ]
  },
  { path: 'sesion', component: Sesion },
  { path: '**', redirectTo: 'inicio' }
];