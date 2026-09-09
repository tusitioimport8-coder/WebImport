import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { Inicio } from './features/inicio/inicio';
import { Catalogo } from './features/catalogo/catalogo';
import { Inventario } from './features/inventario/inventario';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'inicio', component: Inicio },
      { path: 'catalogo', component: Catalogo },
      { path: 'inventario', component: Inventario },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'inicio' }
];