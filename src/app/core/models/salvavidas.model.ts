/**
 * Domain models that mirror the real Nexo API response for the Salvavidas Pyme
 * flow.  All decimal-as-string fields are normalised to `number` by the service.
 *
 * Key insight from the actual API response:
 *  - Financial figures live in  `Data.breakdown`  (not top-level)
 *  - `rate_ea` is a decimal fraction  (0.016 → show as 1.6 %)
 *  - `term_days` is the credit term in calendar days  (not months)
 *  - `installment_amount` is the cuota for `cupo_final`; scale linearly for
 *    amounts the user selects.
 *  - `calendar_context`, `geo_context`, and `scoring` are embedded in the
 *    offer response — no need to call the separate context endpoints to render
 *    the offer screen.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface ScoringComponent {
  name: string;
  weight: number;       // 0–1
  raw_value: number;    // 0–100
  contribution: number; // weight × raw_value
  source: string;
}

export interface ActiveCalendarEvent {
  name: string;
  type?: string | null;
  multiplier: number;
  source: string;
}

export interface ActiveLocalEvent {
  id?: string;
  name: string;
  multiplier: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface GeoZoneInfo {
  id?: string;
  name: string;
  region?: string | null;
  city?: string | null;
  department?: string | null;
  zone_type?: string | null;
  risk_factor: number;
  active_cycle?: string | null;
  cycle_mult: number;
}

// ─── Standalone context endpoint responses ────────────────────────────────────
// (used during the "analyzing" animation phase)

export interface ScoringResponse {
  pyme_id: string;
  user_id: string;
  razon_social: string;
  sector?: string | null;
  score_base: number;
  segment: 'basic' | 'standard' | 'premium' | string;
  cupo_base: number;
  cupo_base_min: number;
  cupo_base_max: number;
  deuda_activa: number;
  components: ScoringComponent[];
}

export interface CalendarContextResponse {
  reference_date?: string;
  is_weekend?: boolean;
  events_active: ActiveCalendarEvent[];
  mult_temporal?: number;   // may be absent — derived from breakdown in offer
  cap_reached: boolean;
  cap_note?: string;
}

export interface GeoContextResponse {
  reference_date?: string;
  zone: GeoZoneInfo;
  local_events: ActiveLocalEvent[];
  fair_multiplier?: number;
  risk_factor?: number;
  cycle_mult?: number;
  ajuste_geo?: number;      // may be absent — derived from breakdown in offer
}

// ─── Offer response — nested shapes ──────────────────────────────────────────

/**
 * Financial breakdown returned by POST /api/v1/agent/salvavidas/
 * All numeric values are already numbers (the service normalises strings).
 */
export interface OfferBreakdown {
  cupo_base: number;
  mult_temporal: number;    // temporal multiplier applied
  ajuste_geo: number;       // geographic adjustment factor
  deuda_activa: number;
  raw_cupo: number;         // gross cupo after multipliers, before deuda & cap
  cupo_pre_ml?: number;     // cupo after deuda subtraction and tier cap, before ML
  cupo_final: number;       // final cupo after ML risk adjustment  ← credit limit
  amount_min: number;       // minimum disbursable amount
  amount_default: number;   // pre-selected default amount
  term_days: number;        // credit term in calendar days (e.g. 45)
  rate_ea: number;          // effective annual rate as decimal (0.016 = 1.6 % EA)
  installment_amount: number; // single cuota for cupo_final; scale for other amounts
  sector_min: number;
  sector_max: number;

  // ── New explanatory flags from the API ──────────────────────────────────────
  /** Set when raw_cupo crossed the segment's tier_cap (e.g. 15M). */
  raw_exceeds_tier_cap?: boolean;
  /** Set when the regulatory cap was applied to produce cupo_pre_ml. */
  cap_applied?: boolean;
  /** Set when the ML risk model further reduced cupo_pre_ml → cupo_final. */
  ml_reduced_cupo?: boolean;
  /** ML risk factor in [0..1] — multiplied against cupo_pre_ml. */
  ml_risk_factor?: number;
}

/** Scoring sub-document embedded inside the offer */
export interface OfferScoring {
  sector?: string | null;
  score_base: number;
  segment: 'basic' | 'standard' | 'premium' | string;
  cupo_base_min: number;
  cupo_base_max: number;
  components: ScoringComponent[];
  model_version?: string;
}

/** Product recommendation included in the offer */
export interface RecommendedProduct {
  id?: string;         // UUID — required for the accept request
  name: string;
  type: string;        // 'inversion' | 'credito' | 'cuenta' | …
  description: string;
  target: string;
}

export interface ProductRecommendation {
  rank: number;
  product: RecommendedProduct;
  eligible: boolean;
  score: number;
  role: 'principal' | 'cross_sell' | string;
  reasons: Array<{ rule: string; passed: boolean; detail: string }>;
  narrative: string;
}

// ─── Main offer response ──────────────────────────────────────────────────────

export interface SalvavidasOfferResponse {
  offer_id: string;
  pyme_id: string;
  razon_social: string;
  reference_date: string;
  breakdown: OfferBreakdown;
  scoring: OfferScoring;
  calendar_context?: CalendarContextResponse;
  geo_context?: GeoContextResponse;
  products_recommended?: ProductRecommendation[];
  message?: string;         // personalised narrative from the agent
  ai_powered?: boolean;
  expires_at?: string;      // ISO-8601 — offer validity deadline
  generated_at?: string;
}

export interface SalvavidasOfferRequest {
  persist?: boolean;
  enable_ai_narrative?: boolean;
}

// ─── Accept offer (step 1 of 2) ───────────────────────────────────────────────
// POST /api/v1/agent/salvavidas/accept

export interface AcceptOfferRequest {
  offer_id: string;
  amount: number;
  product_id: string;
}

export interface AcceptOfferResponse {
  offer_id: string;
  status: string;                 // 'pending'
  amount: number;
  product_id: string;
  product_name: string;
  otp_required: boolean;
  otp_delivery: string;           // 'email'
  otp_expires_in_seconds: number;
  masked_email: string;           // e.g. "u***@gmail.com"
  accepted_at: string;            // ISO-8601
}

// ─── Confirm offer (step 2 of 2) ──────────────────────────────────────────────
// POST /api/v1/agent/salvavidas/confirm

export interface ConfirmOfferRequest {
  offer_id: string;
  otp: string;
}

export interface ConfirmOfferResponse {
  loan_id: string;
  offer_id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  amount: number;
  outstanding_balance: number;
  installment_amount: number;
  term_days: number;
  rate_ea: number;
  status: string;                 // 'active'
  disbursed_at: string;
  next_payment_due: string;
  reference: string;
}
