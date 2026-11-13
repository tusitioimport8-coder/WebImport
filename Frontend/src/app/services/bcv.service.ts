
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export interface BcvRateResponse {
  USD: number;
  effective_date?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BcvService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://bcv.today/api/v1/rate.json';

  getRate(): Observable<number> {
    return this.http.get<BcvRateResponse>(this.apiUrl).pipe(
      map(response => {
        const tasa = Number(response.USD);

        if (!Number.isFinite(tasa) || tasa <= 0) {
          throw new Error('La tasa BCV recibida no es válida');
        }

        return tasa;
      })
    );
  }

  convertirABolivares(detal_bs: number, tasaBCV: number): number {
    return detal_bs * tasaBCV;
  }
}
