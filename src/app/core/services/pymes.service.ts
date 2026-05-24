import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CreditOffer, Pyme } from '../models/pyme.model';
import { MOCK_PYMES } from '../../mocks/pymes.mock';

@Injectable({ providedIn: 'root' })
export class PymesService {
  readonly pymes = signal<Pyme[]>(MOCK_PYMES);
  readonly selectedPymeId = signal<string>(MOCK_PYMES[0].id);

  selectPyme(id: string): void {
    this.selectedPymeId.set(id);
  }

  getPyme(id: string): Observable<Pyme | undefined> {
    const pyme = MOCK_PYMES.find((p) => p.id === id);
    return of(pyme).pipe(delay(220));
  }

  /**
   * Computes the contextual offer combining base score, calendar multiplier and geo adjustment.
   * Cap on temporal multiplier is 1.6 per regulatory rule documented in fintech_ai_solution.md.
   */
  buildOffer(pyme: Pyme): Observable<CreditOffer> {
    const today = new Date();
    const dia = today.getDate();
    const day = today.getDay();

    const eventos = [];
    let multTemporal = 1.0;

    if ([5, 15, 20, 30].includes(dia)) {
      eventos.push({
        id: 'e-quincena',
        nombre: 'Día de quincena',
        tipo: 'dia_pago' as const,
        multiplier: 1.3,
        activo: true,
        detalle: `Hoy es ${dia}, día típico de pago`,
      });
      multTemporal += 0.3;
    }
    if (day === 5 || day === 6 || day === 0) {
      eventos.push({
        id: 'e-finde',
        nombre: 'Fin de semana',
        tipo: 'dia_pago' as const,
        multiplier: 1.15,
        activo: true,
      });
      multTemporal += 0.15;
    }

    const mes = today.getMonth() + 1;
    if (mes === 12) {
      eventos.push({
        id: 'e-navidad',
        nombre: 'Temporada navideña',
        tipo: 'temporada' as const,
        multiplier: 1.5,
        activo: true,
      });
      multTemporal += 0.5;
    } else if (mes === 11) {
      eventos.push({
        id: 'e-blackfriday',
        nombre: 'Black Friday',
        tipo: 'temporada' as const,
        multiplier: 1.4,
        activo: true,
      });
      multTemporal += 0.4;
    } else if (mes === 9) {
      eventos.push({
        id: 'e-amor',
        nombre: 'Amor y Amistad',
        tipo: 'temporada' as const,
        multiplier: 1.25,
        activo: true,
      });
      multTemporal += 0.25;
    }

    // Demo override — Pyme 1 (Distribuciones Vargas) trae feria activa
    if (pyme.zona.feriaActiva) {
      eventos.push({
        id: 'e-feria',
        nombre: pyme.zona.feriaActiva.nombre,
        tipo: 'temporada' as const,
        multiplier: pyme.zona.feriaActiva.multiplier,
        activo: true,
        detalle: pyme.zona.feriaActiva.diasParaInicio
          ? `Inicia en ${pyme.zona.feriaActiva.diasParaInicio} días`
          : undefined,
      });
    }

    if (multTemporal <= 1.0 && pyme.id !== 'pyme-3') {
      eventos.push({
        id: 'e-baseline',
        nombre: 'Día regular',
        tipo: 'dia_pago' as const,
        multiplier: 1.0,
        activo: true,
        detalle: 'Sin eventos especiales activos hoy',
      });
    }

    multTemporal = Math.min(multTemporal, 1.6);

    const feriaMult = pyme.zona.feriaActiva?.multiplier ?? 1.0;
    const ajusteGeo = Number((feriaMult * pyme.zona.riskFactor).toFixed(3));
    const cupoFinal = Math.round(pyme.cupoBase * multTemporal * ajusteGeo);
    const tasaEa = pyme.tramo === 'premium' ? 1.6 : pyme.tramo === 'estandar' ? 2.1 : 2.8;
    const plazoDias = 45;
    const cuotaEstimada = Math.round((cupoFinal * (1 + tasaEa / 100)) / 3);

    const mensaje = this.composeMessage(pyme, cupoFinal, plazoDias, cuotaEstimada, eventos);

    return of({
      pymeId: pyme.id,
      cupoBase: pyme.cupoBase,
      multTemporal: Number(multTemporal.toFixed(2)),
      ajusteGeo,
      cupoFinal,
      plazoDias,
      cuotaEstimada,
      tasaEa,
      eventosActivos: eventos,
      contextoGeo: {
        zona: pyme.zona.nombre,
        feria: pyme.zona.feriaActiva?.nombre,
        ciclo: pyme.zona.cicloActivo,
        riesgo: pyme.zona.riskFactor,
      },
      mensajeAgente: mensaje,
    }).pipe(delay(1800));
  }

  private composeMessage(
    pyme: Pyme,
    cupo: number,
    plazoDias: number,
    cuota: number,
    eventos: { nombre: string }[],
  ): string {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    const intro = `Hola, ${pyme.razonSocial}.`;
    const contexto = eventos.length
      ? ` Detectamos ${eventos.map((e) => e.nombre.toLowerCase()).join(' y ')} — tu flujo lo confirma.`
      : ' Hoy es un día regular en tu zona.';
    return `${intro}${contexto} Tienes disponible un Salvavidas de ${formatter.format(cupo)} a ${plazoDias} días con cuota de ${formatter.format(cuota)}. ¿Lo activamos?`;
  }

  disburse(pymeId: string, amount: number): Observable<{ status: 'desembolsado'; at: Date; nuevoSaldo: number }> {
    return of({
      status: 'desembolsado' as const,
      at: new Date(),
      nuevoSaldo: 12_450_890 + amount,
    }).pipe(delay(1400));
  }
}
