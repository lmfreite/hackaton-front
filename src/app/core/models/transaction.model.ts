export type TransactionType = 'ingreso' | 'egreso';
export type TransactionStatus = 'pending' | 'posted' | 'reversed' | 'failed';

export interface TransactionItem {
  id: string;
  type: TransactionType | string;
  status: TransactionStatus | string;
  /** Decimal string from the API — parse with Number() before use. */
  amount: string;
  channel: string;
  description: string;
  reference_id: string;
  external_id: string;
  /** Account balance immediately before this movement. */
  balance_before: string;
  /** Account balance immediately after this movement. */
  balance_after: string;
  is_reversal: boolean;
  created_at: string; // ISO-8601
}

export interface TransactionFilters {
  page?: number;
  size?: number;
  type?: string | null;
  channel?: string | null;
  status?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  search?: string | null;
}

// ── Legacy mock types (kept for backward compat with account.mock.ts) ────────
/** @deprecated Use TransactionItem for real API data. */
export interface Transaction {
  id: string;
  fecha: Date;
  descripcion: string;
  categoria: string;
  monto: number;
  signo: 'ingreso' | 'egreso';
  estado: 'completada' | 'pendiente' | 'rechazada';
}

/** @deprecated Mock-only type. */
export interface AccountSummary {
  numeroCuenta: string;
  saldoTotal: number;
  moneda: string;
  variacionPct: number;
  gastosMensuales: number;
  variacionGastosPct: number;
  aprobacionesPendientes: number;
}
