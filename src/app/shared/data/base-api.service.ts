import { Injectable } from '@angular/core';
import { Observable, defer, delay, of, switchMap, throwError } from 'rxjs';

@Injectable()
export abstract class BaseApiService {
  protected abstract readonly responseDelayMs: number;

  protected simulateRequest<T>(handler: () => T): Observable<T> {
    return defer(() => {
      try {
        return of(handler()).pipe(delay(this.responseDelayMs));
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Неизвестная ошибка API.');
        return of(null).pipe(
          delay(this.responseDelayMs),
          switchMap(() => throwError(() => err)),
        );
      }
    });
  }

  protected createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
