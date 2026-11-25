
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { AuthService } from '../../../services/auth';
import { BannerService } from '../../../services/banner.service';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.less'
})
export class SiteFooter implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly bannerService = inject(BannerService);

  readonly logoUrl = signal('/images/logo.svg');
  readonly uploadingLogo = signal(false);

  readonly canEditLogo = computed(() => {
    const rol = this.authService.user()?.tipo?.trim().toUpperCase();
    return rol === 'ADMIN' || rol === 'MARKETING';
  });

  readonly categoriasFooter: string[] = [
    'Accesorios para carros',
    'Cámaras wifi y seguridad',
    'Belleza',
    'Accesorios para motos',
    'Cocina',
    'Hogar',
    'Audífonos',
    'Cornetas',
    'Juegos',
    'Barbería',
    'Electrónicos',
    'Oficina',
    'Cables y cargadores',
    'Gym',
    'Perfumes',
    'Herramientas',
    'Salud',
  ];

  ngOnInit(): void {
    this.bannerService.getBanner('home-logo').subscribe({
      next: response => {
        const imagen = response.data?.activo
          ? response.data.imagenes?.[0]
          : null;

        if (imagen?.publicUrl) {
          this.logoUrl.set(imagen.publicUrl);
        }
      },
      error: error => {
        if (error.status !== 404) {
          console.error('Error cargando logo:', error);
        }
      }
    });
  }
  
get categoriasFooterOrdenadas(): string[] {
  return [...this.categoriasFooter].sort(
    (a, b) => b.length - a.length
  );
}
  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file || !this.canEditLogo() || this.uploadingLogo()) {
      return;
    }

    const tiposPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml'
    ];

    if (!tiposPermitidos.includes(file.type)) {
      alert('Selecciona una imagen PNG, JPG, WEBP o SVG.');
      return;
    }

    this.uploadingLogo.set(true);

    this.bannerService.requestUploadUrl(file).pipe(
      switchMap(response => {
        if (!response.success || !response.data) {
          throw new Error('No se pudo preparar la subida del logo.');
        }

        const { uploadUrl, publicUrl, objectKey } = response.data;

        return this.bannerService.uploadImage(uploadUrl, file).pipe(
          switchMap(() =>
            this.bannerService.saveBanner('home-logo', [
              { objectKey, publicUrl }
            ])
          )
        );
      })
    ).subscribe({
      next: response => {
        if (response.success) {
          const nuevaUrl = response.data?.imagenes?.[0]?.publicUrl;

          if (nuevaUrl) {
            this.logoUrl.set(nuevaUrl);
          }
        }

        this.uploadingLogo.set(false);
      },
      error: error => {
        console.error('Error subiendo logo:', error);
        alert('No se pudo actualizar el logo.');
        this.uploadingLogo.set(false);
      }
    });
  }
}
