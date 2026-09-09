import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TuiRoot, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiNavigation } from '@taiga-ui/layout';
import { TuiTabs } from '@taiga-ui/kit';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TuiRoot,
    TuiNavigation,
    TuiButton,
    TuiIcon,
    TuiTabs
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.less',
})
export class Layout {
  private router = inject(Router);

  expanded = signal(true);
  open = false;
  activeItemIndex = 0;

  handleToggle(): void {
    this.expanded.set(!this.expanded());
  }

 async navegar(ruta: string, tabIndex: number): Promise<void> {
  console.log('Intentando navegar a:', ruta);

  try {
    const resultado = await this.router.navigateByUrl(ruta);

    console.log('Resultado:', resultado);
    console.log('URL actual:', this.router.url);

    if (resultado) {
      this.activeItemIndex = tabIndex;
    }
  } catch (error) {
    console.error('ERROR DE NAVEGACIÓN:', error);
  }
}
}