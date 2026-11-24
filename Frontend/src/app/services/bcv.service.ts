import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

export interface CromStudioTasas {
  USD: number;
  EUR: number;
}

export interface BcvRateResponse {
  fuente?: string;
  fecha_valor?: string;
  tasas: CromStudioTasas;
  actualizado_el?: string;
}

export interface BcvRateDetails {
  usd: number;
  eur: number;
  fechaValor?: string;
  actualizadoEl?: string;
  fuente?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BcvService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://datos.cromstudio.com.ve/tasa';

  private fetchRate(): Observable<BcvRateResponse> {
    return this.http.get<BcvRateResponse>(this.apiUrl, {
      params: { _t: Date.now() },
    });
  }

  getRate(): Observable<number> {
    return this.fetchRate().pipe(
      map((response) => {
        const tasa = Number(response?.tasas?.USD);

        if (!Number.isFinite(tasa) || tasa <= 0) {
          throw new Error('La tasa BCV recibida no es válida');
        }

        return tasa;
      }),
      catchError((error) =>
        throwError(() =>
          error instanceof Error ? error : new Error('No se pudo consultar la tasa BCV'),
        ),
      ),
    );
  }

  getRateDetails(): Observable<BcvRateDetails> {
    return this.fetchRate().pipe(
      map((response) => {
        const usd = Number(response?.tasas?.USD);
        const eur = Number(response?.tasas?.EUR);

        if (!Number.isFinite(usd) || usd <= 0) {
          throw new Error('La tasa USD recibida no es válida');
        }

        return {
          usd,
          eur: Number.isFinite(eur) ? eur : 0,
          fechaValor: response.fecha_valor,
          actualizadoEl: response.actualizado_el,
          fuente: response.fuente,
        };
      }),
      catchError((error) =>
        throwError(() =>
          error instanceof Error
            ? error
            : new Error('No se pudo consultar el detalle de la tasa BCV'),
        ),
      ),
    );
  }

  convertirABolivares(detal_bs: number, tasaBCV: number): number {
    return detal_bs * tasaBCV;
  }
}
