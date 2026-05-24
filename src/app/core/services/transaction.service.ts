import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { StandardResponse } from '../models/api.model';
import { TransactionFilters, TransactionItem } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly transactions = signal<TransactionItem[]>([]);
  readonly currentPage = signal(1);
  /** True when the last response returned exactly `size` items (there may be more). */
  readonly hasMore = signal(false);

  readonly PAGE_SIZE = 20;

  list(filters: TransactionFilters = {}): Observable<TransactionItem[]> {
    this.loading.set(true);

    const size = filters.size ?? this.PAGE_SIZE;
    let params = new HttpParams()
      .set('page', (filters.page ?? 1).toString())
      .set('size', size.toString());

    if (filters.type)      params = params.set('type', filters.type);
    if (filters.channel)   params = params.set('channel', filters.channel);
    if (filters.status)    params = params.set('status', filters.status);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to)   params = params.set('date_to', filters.date_to);
    if (filters.search)    params = params.set('search', filters.search);

    return this.http
      .get<StandardResponse<TransactionItem[]>>('/api/v1/transactions/me', { params })
      .pipe(
        map((res) => res.Data ?? []),
        tap((items) => {
          this.transactions.set(items);
          this.currentPage.set(filters.page ?? 1);
          this.hasMore.set(items.length === size);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          return throwError(() => err);
        }),
      );
  }
}
