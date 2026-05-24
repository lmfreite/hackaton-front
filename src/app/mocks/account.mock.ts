import { AccountSummary, Transaction } from '../core/models/transaction.model';

export const MOCK_ACCOUNT: AccountSummary = {
  numeroCuenta: 'SRF-4012-7890-06',
  saldoTotal: 8_742_350,
  moneda: 'COP',
  variacionPct: 3.1,
  gastosMensuales: 4_180_000,
  variacionGastosPct: -1.8,
  aprobacionesPendientes: 2,
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    fecha: new Date(2026, 4, 22),
    descripcion: 'Pago proveedor Logística Central',
    categoria: 'Proveedores',
    monto: 1_850_000,
    signo: 'egreso',
    estado: 'completada',
  },
  {
    id: 't-2',
    fecha: new Date(2026, 4, 21),
    descripcion: 'Recaudo cliente Supermercados Éxito',
    categoria: 'Cobros',
    monto: 3_200_000,
    signo: 'ingreso',
    estado: 'pendiente',
  },
  {
    id: 't-3',
    fecha: new Date(2026, 4, 20),
    descripcion: 'Combustible flota vehículos',
    categoria: 'Operación',
    monto: 620_000,
    signo: 'egreso',
    estado: 'completada',
  },
  {
    id: 't-4',
    fecha: new Date(2026, 4, 18),
    descripcion: 'Nómina quincenal mayo',
    categoria: 'Nómina',
    monto: 2_450_000,
    signo: 'egreso',
    estado: 'completada',
  },
  {
    id: 't-5',
    fecha: new Date(2026, 4, 17),
    descripcion: 'Recaudo Almacenes La 14',
    categoria: 'Cobros',
    monto: 1_740_000,
    signo: 'ingreso',
    estado: 'completada',
  },
];
