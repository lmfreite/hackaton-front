export type SectorPyme = 'comercio' | 'servicios' | 'alimentos' | 'logistica';

export type TramoCupo = 'basico' | 'estandar' | 'premium';

export interface GeoZone {
  id: string;
  nombre: string;
  region: string;
  riskFactor: number;
  cicloActivo?: string;
  cicloMultiplier?: number;
  feriaActiva?: {
    nombre: string;
    multiplier: number;
    diasParaInicio?: number;
  };
}

export interface Pyme {
  id: string;
  nit: string;
  razonSocial: string;
  sector: SectorPyme;
  zona: GeoZone;
  flujoCajaPromedio: number;
  volumenTransaccional: number;
  historialCrediticio: number;
  recaudosRegulares: number;
  antiguedadMeses: number;
  deudaActiva: number;
  scoreBase: number;
  cupoBase: number;
  tramo: TramoCupo;
}

export interface CalendarEvent {
  id: string;
  nombre: string;
  tipo: 'dia_pago' | 'temporada' | 'deporte' | 'festivo';
  multiplier: number;
  activo: boolean;
  detalle?: string;
}

export interface CreditOffer {
  pymeId: string;
  cupoBase: number;
  multTemporal: number;
  ajusteGeo: number;
  cupoFinal: number;
  plazoDias: number;
  cuotaEstimada: number;
  tasaEa: number;
  eventosActivos: CalendarEvent[];
  contextoGeo: {
    zona: string;
    feria?: string;
    ciclo?: string;
    riesgo: number;
  };
  mensajeAgente: string;
}
