import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { StandardResponse } from '../models/api.model';
import {
  AcceptOfferRequest,
  AcceptOfferResponse,
  CalendarContextResponse,
  ConfirmOfferRequest,
  ConfirmOfferResponse,
  GeoContextResponse,
  OfferBreakdown,
  SalvavidasOfferRequest,
  SalvavidasOfferResponse,
  ScoringComponent,
  ScoringResponse,
} from '../models/salvavidas.model';

/**
 * Service in charge of every call related to the Salvavidas Pyme agent.
 *
 * Flow:
 *  1. loadFullContext() — fires scoring + calendar + geo in parallel so the
 *     "analyzing" animation can show real data while it loads.
 *  2. computeOffer()   — POST to the agent; the response embeds authoritative
 *     calendar_context, geo_context, and scoring, which are used to refresh
 *     the corresponding signals so the UI is always consistent with the offer.
 */
@Injectable({ providedIn: 'root' })
export class SalvavidasService {
  private readonly http = inject(HttpClient);

  readonly scoring = signal<ScoringResponse | null>(null);
  readonly calendar = signal<CalendarContextResponse | null>(null);
  readonly geo = signal<GeoContextResponse | null>(null);
  readonly offer = signal<SalvavidasOfferResponse | null>(null);
  readonly acceptData = signal<AcceptOfferResponse | null>(null);
  readonly confirmation = signal<ConfirmOfferResponse | null>(null);

  // ─── Context endpoints (for the analyze animation) ──────────────────────

  getScoring(): Observable<ScoringResponse> {
    return this.http
      .get<StandardResponse<ScoringResponse>>('/api/v1/scoring/me')
      .pipe(
        map((res) => this.normalizeScoring(res.Data)),
        map((data) => { this.scoring.set(data); return data; }),
      );
  }

  getCalendarContext(): Observable<CalendarContextResponse> {
    return this.http
      .get<StandardResponse<CalendarContextResponse>>('/api/v1/calendar/context')
      .pipe(
        map((res) => res.Data),
        map((data) => { this.calendar.set(data); return data; }),
      );
  }

  getGeoContext(): Observable<GeoContextResponse> {
    return this.http
      .get<StandardResponse<GeoContextResponse>>('/api/v1/geo/context')
      .pipe(
        map((res) => res.Data),
        map((data) => { this.geo.set(data); return data; }),
      );
  }

  /**
   * Fires the three context endpoints in parallel.
   * Individual failures are swallowed so a single unavailable endpoint
   * never blocks the entire analyze phase — the offer embeds this data anyway.
   */
  loadFullContext(): Observable<{
    scoring: ScoringResponse | null;
    calendar: CalendarContextResponse | null;
    geo: GeoContextResponse | null;
  }> {
    return forkJoin({
      scoring: this.getScoring().pipe(catchError(() => of(null))),
      calendar: this.getCalendarContext().pipe(catchError(() => of(null))),
      geo: this.getGeoContext().pipe(catchError(() => of(null))),
    });
  }

  // ─── Offer ──────────────────────────────────────────────────────────────

  /** Asks the agent to compute (and optionally persist) a credit offer. */
  computeOffer(payload: SalvavidasOfferRequest = {}): Observable<SalvavidasOfferResponse> {
    const body: SalvavidasOfferRequest = { persist: true, enable_ai_narrative: true, ...payload };

    return this.http
      .post<StandardResponse<SalvavidasOfferResponse> | SalvavidasOfferResponse>(
        '/api/v1/agent/salvavidas/',
        body,
      )
      .pipe(
        map((res) => this.unwrap<SalvavidasOfferResponse>(res)),
        map((data) => this.normalizeOffer(data)),
        map((data) => {
          this.offer.set(data);
          // The offer is the authoritative source — refresh context signals so
          // the UI is always consistent with what the agent actually used.
          this.syncContextSignals(data);
          return data;
        }),
      );
  }

  // ─── Accept (step 1) ────────────────────────────────────────────────────────

  /**
   * Moves the offer to ACCEPTED status and dispatches a 6-digit OTP to the
   * user's email.  The response contains the masked_email and the OTP TTL so
   * the UI can show a countdown.  Disbursement only happens after /confirm.
   */
  acceptOffer(payload: AcceptOfferRequest): Observable<AcceptOfferResponse> {
    return this.http
      .post<StandardResponse<AcceptOfferResponse>>(
        '/api/v1/agent/salvavidas/accept',
        payload,
      )
      .pipe(
        map((res) => res.Data),
        map((data) => ({ ...data, amount: Number(data.amount) })),
        map((data) => {
          this.acceptData.set(data);
          return data;
        }),
      );
  }

  // ─── Confirm (step 2) ───────────────────────────────────────────────────────

  /**
   * Validates the OTP and finalises the disbursement.  Creates the Loan record
   * and posts an `ingreso` transaction.  Returns the full loan summary.
   */
  confirmOffer(payload: ConfirmOfferRequest): Observable<ConfirmOfferResponse> {
    return this.http
      .post<StandardResponse<ConfirmOfferResponse>>(
        '/api/v1/agent/salvavidas/confirm',
        payload,
      )
      .pipe(
        map((res) => res.Data),
        map((data) => ({
          ...data,
          amount: Number(data.amount),
          outstanding_balance: Number(data.outstanding_balance),
          installment_amount: Number(data.installment_amount),
          rate_ea: Number(data.rate_ea),
        })),
        map((data) => {
          this.confirmation.set(data);
          return data;
        }),
      );
  }

  reset(): void {
    this.scoring.set(null);
    this.calendar.set(null);
    this.geo.set(null);
    this.offer.set(null);
    this.acceptData.set(null);
    this.confirmation.set(null);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /** Unwraps `{Success, Message, Data}` envelopes when present. */
  private unwrap<T>(res: StandardResponse<T> | T): T {
    if (res && typeof res === 'object' && 'Data' in (res as Record<string, unknown>)) {
      return (res as StandardResponse<T>).Data;
    }
    return res as T;
  }

  /**
   * After the offer lands, update calendar, geo and scoring signals with the
   * embedded data so they are consistent with the computed offer even if the
   * standalone context calls failed or returned stale data.
   */
  private syncContextSignals(data: SalvavidasOfferResponse): void {
    // Calendar: synthesise mult_temporal from breakdown (not in calendar_context itself)
    if (data.calendar_context) {
      this.calendar.set({
        ...data.calendar_context,
        reference_date: data.reference_date,
        mult_temporal: data.breakdown.mult_temporal,
      });
    }

    // Geo: ajuste_geo lives in breakdown; risk_factor + cycle_mult in zone
    if (data.geo_context) {
      this.geo.set({
        ...data.geo_context,
        reference_date: data.reference_date,
        ajuste_geo: data.breakdown.ajuste_geo,
        risk_factor: data.geo_context.zone.risk_factor,
        cycle_mult: data.geo_context.zone.cycle_mult,
      });
    }

    // Scoring: the offer embeds scoring without razon_social / pyme_id —
    // synthesise a full ScoringResponse only if the separate call didn't land.
    if (!this.scoring() && data.scoring) {
      this.scoring.set({
        pyme_id: data.pyme_id,
        user_id: '',
        razon_social: data.razon_social,
        sector: data.scoring.sector ?? null,
        score_base: data.scoring.score_base,
        segment: data.scoring.segment,
        cupo_base: data.breakdown.cupo_base,
        cupo_base_min: data.scoring.cupo_base_min,
        cupo_base_max: data.scoring.cupo_base_max,
        deuda_activa: data.breakdown.deuda_activa,
        components: data.scoring.components as ScoringComponent[],
      });
    }
  }

  private normalizeScoring(data: ScoringResponse): ScoringResponse {
    return {
      ...data,
      score_base: Number(data.score_base ?? 0),
      cupo_base: Number(data.cupo_base ?? 0),
      cupo_base_min: Number(data.cupo_base_min ?? 0),
      cupo_base_max: Number(data.cupo_base_max ?? 0),
      deuda_activa: Number(data.deuda_activa ?? 0),
    };
  }

  private normalizeOffer(data: SalvavidasOfferResponse): SalvavidasOfferResponse {
    const num = (v: unknown): number => (v == null ? 0 : Number(v));

    const bd = data.breakdown ?? ({} as OfferBreakdown);

    return {
      ...data,
      breakdown: {
        cupo_base: num(bd.cupo_base),
        mult_temporal: num(bd.mult_temporal),
        ajuste_geo: num(bd.ajuste_geo),
        deuda_activa: num(bd.deuda_activa),
        raw_cupo: num(bd.raw_cupo),
        cupo_pre_ml: bd.cupo_pre_ml != null ? num(bd.cupo_pre_ml) : undefined,
        cupo_final: num(bd.cupo_final),
        amount_min: num(bd.amount_min),
        amount_default: num(bd.amount_default),
        term_days: num(bd.term_days),
        rate_ea: num(bd.rate_ea),
        installment_amount: num(bd.installment_amount),
        sector_min: num(bd.sector_min),
        sector_max: num(bd.sector_max),
        raw_exceeds_tier_cap: bd.raw_exceeds_tier_cap ?? false,
        cap_applied: bd.cap_applied ?? false,
        ml_reduced_cupo: bd.ml_reduced_cupo ?? false,
        ml_risk_factor: bd.ml_risk_factor != null ? num(bd.ml_risk_factor) : undefined,
      },
      scoring: data.scoring
        ? {
            ...data.scoring,
            score_base: num(data.scoring.score_base),
            cupo_base_min: num(data.scoring.cupo_base_min),
            cupo_base_max: num(data.scoring.cupo_base_max),
          }
        : data.scoring,
    };
  }
}
