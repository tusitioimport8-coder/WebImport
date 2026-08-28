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

  navegar(ruta: string, tabIndex: number): void {
    this.activeItemIndex = tabIndex;
    this.router.navigateByUrl(ruta);
  }
}