
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  shareReplay,
  throwError
} from 'rxjs';

export interface ApiCategory {
  id: number;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:5000/api/categorias';

  // Una única petición compartida y cacheada.
  private categoriesCache$?: Observable<ApiCategory[]>;

  getCategories(): Observable<ApiCategory[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http
        .get<ApiCategory[]>(this.apiUrl)
        .pipe(
          catchError(error => {
            // Permite reintentar en una futura llamada.
            this.categoriesCache$ = undefined;
            return throwError(() => error);
          }),
          shareReplay({
            bufferSize: 1,
            refCount: false
          })
        );
    }

    return this.categoriesCache$;
  }

  clearCache(): void {
    this.categoriesCache$ = undefined;
  }
}
