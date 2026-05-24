import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { StandardResponse } from '../models/api.model';

export interface OverviewKpis {
  total_income_30d: number;
  total_expense_30d: number;
  net_cashflow_30d: number;
  avg_daily_net_30d: number;
  income_transactions_30d: number;
  expense_transactions_30d: number;
  top_channel?: string;
  last_transaction_at?: string;
}

export interface OverviewOffer {
  cupo_final: number;
  amount_min: number;
  amount_default: number;
  term_days: number;
  rate_nm: number;
  rate_ea: number;                // decimal fraction (0.153895 = 15.39 % EA)
  standard_rate_nm?: number;
  standard_rate_ea?: number;
  rate_preferential?: boolean;
  rate_discount_pct?: number;     // e.g. 53.26 (percentage discount vs standard)
  installment_amount: number;
  cupo_base?: number;
  mult_temporal?: number;
  ajuste_geo?: number;
  cupo_base_min?: number;
  cupo_base_max?: number;
}

/** Single transaction inside the forecast.history array of the overview. */
export interface ForecastHistoryItem {
  id: string;
  type: 'ingreso' | 'egreso' | string;
  status: 'posted' | 'pending' | 'reversed' | 'failed' | string;
  amount: number;
  currency?: string;
  channel: string;
  description: string;
  reference_id?: string;
  external_id?: string;
  balance_before?: number;
  balance_after?: number;
  is_reversal?: boolean;
  is_credit_disbursement?: boolean;
  created_at: string; // ISO-8601
}

export interface ForecastHistory {
  pyme_id?: string;
  user_id?: string;
  window_days?: number;
  history: ForecastHistoryItem[];
  [key: string]: unknown;
}

export interface DashboardOverview {
  pyme_id?: string;
  razon_social?: string;
  reference_date?: string;
  kpis?: OverviewKpis;
  offer?: OverviewOffer;
  ai_summary?: string;          // ← agent's personalised credit announcement
  products_recommended?: unknown[];
  forecast?: ForecastHistory;   // ← history embedded in the overview response
  // kept for backward compat / fallback fields
  saldo_total?: number;
  moneda?: string;
  numero_cuenta?: string;
  [key: string]: unknown;
}

export interface DashboardForecastPoint {
  date: string;
  predicted_net: number;
  lower_bound: number;
  upper_bound: number;
  expected_event_uplift?: number;
  active_events?: string[];
}

export interface DashboardForecastResponse {
  pyme_id: string;
  user_id: string;
  window_days: number;
  forecast: DashboardForecastPoint[];
  aggregate_predicted_net_7d: number;
  aggregate_predicted_net_30d: number;
  baseline_daily_net: number;
  volatility: number;
  confidence: number;
  model_version: string;
  generated_at: string;
}

/**
 * Wraps the dashboard endpoints. Both methods recover gracefully on failure
 * so the demo UI never breaks if the backend is unreachable.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  readonly overview = signal<DashboardOverview | null>(null);
  readonly forecast = signal<DashboardForecastResponse | null>(null);

  getOverview(): Observable<DashboardOverview | null> {
    return this.http
      .get<StandardResponse<DashboardOverview> | DashboardOverview>('/api/v1/dashboard/overview')
      .pipe(
        map((res) => this.unwrap<DashboardOverview>(res)),
        map((data) => {
          this.overview.set(data);
          return data;
        }),
        catchError(() => of(null)),
      );
  }

  getForecast(): Observable<DashboardForecastResponse | null> {
    return this.http
      .get<StandardResponse<DashboardForecastResponse>>('/api/v1/dashboard/forecast')
      .pipe(
        map((res) => res?.Data ?? null),
        map((data) => {
          if (data) this.forecast.set(data);
          return data;
        }),
        catchError(() => of(null)),
      );
  }

  private unwrap<T>(res: StandardResponse<T> | T): T {
    if (res && typeof res === 'object' && 'Data' in (res as Record<string, unknown>)) {
      return (res as StandardResponse<T>).Data;
    }
    return res as T;
  }
}
