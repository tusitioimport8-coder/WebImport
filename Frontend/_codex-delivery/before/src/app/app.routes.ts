import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout'; // Ajusta tus rutas de importación
import { Inicio } from './features/inicio/inicio';
import { Catalogo } from './features/catalogo/catalogo';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'inicio', component: Inicio },
      { path: 'catalogo', component: Catalogo },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  }
];