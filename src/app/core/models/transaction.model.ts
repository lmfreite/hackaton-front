export type TransactionStatus = 'completada' | 'pendiente' | 'rechazada';

export interface Transaction {
  id: string;
  fecha: Date;
  descripcion: string;
  categoria: string;
  monto: number;
  signo: 'ingreso' | 'egreso';
  estado: TransactionStatus;
}

export interface AccountSummary {
  numeroCuenta: string;
  saldoTotal: number;
  moneda: string;
  variacionPct: number;
  gastosMensuales: number;
  variacionGastosPct: number;
  aprobacionesPendientes: number;
}
