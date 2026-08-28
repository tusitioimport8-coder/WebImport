import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Tag } from 'primeng/tag';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    Tag,
    TuiButton,
    TuiCardLarge,
    TuiHeader
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.less',
})
export class Inicio implements OnInit, OnDestroy {
  products = [
    { id: '1', name: 'Laptop Gamer RGB 16"', price: 1299.99, status: 'INSTOCK', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80' },
    { id: '2', name: 'Auriculares Inalámbricos', price: 189.50, status: 'INSTOCK', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
    { id: '3', name: 'Smartwatch Sport v2', price: 145.00, status: 'LOWSTOCK', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' },
    { id: '4', name: 'Teclado Mecánico Wireless', price: 99.99, status: 'OUTOFSTOCK', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80' },
    { id: '5', name: 'Cámara Reflex 4K Pro', price: 850.00, status: 'INSTOCK', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80' }
  ];

  translateX = signal(0);
  isTransitioning = signal(true);
  private autoplayTimer: any;

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.next();
    }, 2500); // Ritmo fluido de 2.5 segundos
  }

  stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
    }
  }

  next(): void {
    if (this.translateX() !== 0) return; // Evita clics repetidos antes de terminar la animación
    this.startAutoplay();
    this.isTransitioning.set(true);
    this.translateX.set(-33.3333);
  }

  prev(): void {
    if (this.translateX() !== 0) return;
    this.startAutoplay();
    this.isTransitioning.set(false);
    const last = this.products.pop();
    if (last) this.products.unshift(last);
    this.translateX.set(-33.3333);

    setTimeout(() => {
      this.isTransitioning.set(true);
      this.translateX.set(0);
    }, 20);
  }

  onTransitionEnd(): void {
    if (this.translateX() < 0) {
      this.isTransitioning.set(false);
      const first = this.products.shift();
      if (first) this.products.push(first);
      this.translateX.set(0);
    }
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'INSTOCK': return 'success';
      case 'LOWSTOCK': return 'warn';
      case 'OUTOFSTOCK': return 'danger';
      default: return 'info';
    }
  }
}