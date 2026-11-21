
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TuiInput, TuiTextfield } from '@taiga-ui/core';
import { switchMap } from 'rxjs';

import { AuthService } from '../../../services/auth';
import { BannerService } from '../../../services/banner.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TuiInput,
    TuiTextfield
  ],
  templateUrl: './site-header.html',
  styleUrl: './site-header.less'
})
export class SiteHeader implements OnInit {

  // =========================================
  // INPUTS ORIGINALES
  // =========================================

  @Input() searchTerm = '';
  @Input() wishlistCount = 0;
  @Input() cartCount = 0;
  @Input() isAuthenticated = false;
  @Input() canAccessAdmin = false;
  @Input() canAccessPresupuestos = false;
  @Input() canAccessInventory = false;

  // =========================================
  // OUTPUTS ORIGINALES
  // =========================================

  @Output() searchSubmit = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() wishlistClick = new EventEmitter<void>();
  @Output() cartClick = new EventEmitter<void>();

  // Evento para abrir el panel lateral Mi Perfil
  @Output() profileClick = new EventEmitter<void>();

  // =========================================
  // SERVICIOS
  // =========================================

  private readonly authService = inject(AuthService);
  private readonly bannerService = inject(BannerService);

  // =========================================
  // LOGO EDITABLE
  // =========================================

  readonly logoUrl = signal('/images/logo.svg');

  readonly uploadingLogo = signal(false);

  readonly logoError = signal<string | null>(null);

  // Solo ADMIN y MARKETING pueden cambiar el logo
  readonly canEditLogo = computed(() => {
    const rol = this.authService.user()?.tipo?.trim().toUpperCase();

    return rol === 'ADMIN' || rol === 'MARKETING';
  });

  // =========================================
  // CARGAR LOGO AL INICIAR
  // =========================================

  ngOnInit(): void {
    this.loadLogo();
  }

  loadLogo(): void {
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
          console.error(
            'Error cargando logo del header:',
            error
          );
        }
      }
    });
  }

  // =========================================
  // CAMBIAR LOGO DESDE EL BOTON VERDE
  // =========================================

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    input.value = '';

    if (
      !file ||
      !this.canEditLogo() ||
      this.uploadingLogo()
    ) {
      return;
    }

    // Formatos admitidos
    const tiposPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp'
    ];

    if (!tiposPermitidos.includes(file.type)) {
      this.logoError.set(
        'Selecciona una imagen PNG, JPG o WEBP.'
      );

      alert(this.logoError());

      return;
    }

    this.logoError.set(null);
    this.uploadingLogo.set(true);

    // PASO 1: Solicitar URL de subida
    this.bannerService.requestUploadUrl(file).pipe(

      switchMap(response => {

        if (!response.success || !response.data) {
          throw new Error(
            'No se pudo preparar la subida del logo.'
          );
        }

        const {
          uploadUrl,
          publicUrl,
          objectKey
        } = response.data;

        // PASO 2: Subir imagen a S3
        return this.bannerService.uploadImage(
          uploadUrl,
          file
        ).pipe(

          // PASO 3: Guardar logo en backend
          switchMap(() =>
            this.bannerService.saveBanner(
              'home-logo',
              [
                {
                  objectKey,
                  publicUrl
                }
              ]
            )
          )

        );
      })

    ).subscribe({

      // =====================================
      // SUBIDA EXITOSA
      // =====================================

      next: response => {

        if (!response.success) {
          this.logoError.set(
            'No se pudo guardar el nuevo logo.'
          );

          alert(this.logoError());

          this.uploadingLogo.set(false);

          return;
        }

        const nuevaUrl =
          response.data?.imagenes?.[0]?.publicUrl;

        if (nuevaUrl) {
          this.logoUrl.set(nuevaUrl);
        } else {
          this.loadLogo();
        }

        this.logoError.set(null);
        this.uploadingLogo.set(false);
      },

      // =====================================
      // ERROR DE SUBIDA
      // =====================================

      error: error => {

        console.error(
          'Error subiendo logo del header:',
          error
        );

        this.logoError.set(
          'No se pudo actualizar el logo.'
        );

        alert(this.logoError());

        this.uploadingLogo.set(false);
      }

    });
  }
}
