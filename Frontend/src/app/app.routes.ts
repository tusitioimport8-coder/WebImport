import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { Inicio } from './features/inicio/inicio';
import { Catalogo } from './features/catalogo/catalogo'; // 1. Importar el componente

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: Inicio },
      { path: 'catalogo', component: Catalogo } // 2. Registrar la ruta aquí
    ]
  }
];