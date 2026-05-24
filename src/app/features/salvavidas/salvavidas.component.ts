import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { StatusChipComponent } from '../../shared/ui/status-chip/status-chip.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

import { SalvavidasService } from '../../core/services/salvavidas.service';
import { AuthService } from '../../core/services/auth.service';

type Stage = 'analyzing' | 'offer' | 'accepting' | 'otp' | 'confirming' | 'done' | 'error';

@Component({
  selector: 'app-salvavidas',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    FormsModule,
    CardComponent,
    ButtonComponent,
    IconComponent,
    StatusChipComponent,
    BadgeComponent,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './salvavidas.component.html',
  styleUrl: './salvavidas.component.scss',
})
export class SalvavidasComponent implements OnInit, OnDestroy {
  private readonly svc = inject(SalvavidasService);
  private readonly auth = inject(AuthService);

  readonly stage = signal<Stage>('analyzing');
  readonly errorMessage = signal<string>('');
  readonly selectedAmount = signal<number>(0);
  readonly showScoreDetail = signal(false);

  // ── OTP state ───────────────────────────────────────────────────────────
  readonly otpValue = signal('');
  readonly otpError = signal<string | null>(null);
  readonly otpSecondsLeft = signal(0);
  readonly otpCountdown = computed(() => {
    const s = this.otpSecondsLeft();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  });

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // ── Raw signals from service ────────────────────────────────────────────
  readonly offer = this.svc.offer;
  readonly scoring = this.svc.scoring;
  readonly calendar = this.svc.calendar;
  readonly geo = this.svc.geo;
  readonly acceptData = this.svc.acceptData;
  readonly confirmation = this.svc.confirmation;
  readonly user = this.auth.user;

  // ── Core offer amounts (all from breakdown) ─────────────────────────────
  readonly cupoFinal = computed(() => this.offer()?.breakdown?.cupo_final ?? 0);
  readonly cupoMin = computed(() => this.offer()?.breakdown?.amount_min ?? 500_000);
  readonly rawCupo = computed(() => this.offer()?.breakdown?.raw_cupo ?? 0);

  /**
   * Effective annual rate as a percentage.
   * API returns rate_ea as a decimal fraction (0.016 → 1.6 % EA).
   */
  readonly rateEA = computed(() => (this.offer()?.breakdown?.rate_ea ?? 0) * 100);

  /** Credit term in calendar days (e.g. 45). */
  readonly termDays = computed(() => this.offer()?.breakdown?.term_days ?? 0);

  /**
   * Cuota (installment) scaled linearly to the user-selected amount.
   * The API returns installment_amount for cupo_final; we scale proportionally.
   */
  readonly cuotaMensual = computed(() => {
    const bd = this.offer()?.breakdown;
    if (!bd) return 0;
    const baseCuota = bd.installment_amount;
    const baseCupo = bd.cupo_final;
    const selected = this.selectedAmount();
    if (baseCupo > 0 && selected > 0) {
      return Math.round(baseCuota * (selected / baseCupo));
    }
    return Math.round(baseCuota);
  });

  readonly progressPct = computed(() => {
    const cupo = this.cupoFinal();
    if (cupo <= 0) return 0;
    return Math.round((this.selectedAmount() / cupo) * 100);
  });

  // ── Context multipliers (from breakdown as authoritative source) ─────────
  readonly multTemporal = computed(
    () => this.offer()?.breakdown?.mult_temporal ?? this.calendar()?.mult_temporal ?? 1,
  );
  readonly ajusteGeo = computed(
    () => this.offer()?.breakdown?.ajuste_geo ?? this.geo()?.ajuste_geo ?? 1,
  );
  /** Combined boost factor applied to the base cupo. */
  readonly combinedMult = computed(() => this.multTemporal() * this.ajusteGeo());
  /** True when multipliers pushed raw_cupo above the segment cap. */
  readonly rawExceedsCap = computed(
    () => this.rawCupo() > 0 && this.cupoFinal() > 0 && this.rawCupo() > this.cupoFinal(),
  );
  readonly scoreBase = computed(
    () => this.offer()?.scoring?.score_base ?? this.scoring()?.score_base ?? 0,
  );

  // ── Pyme identity (razon_social lives at top level of offer) ────────────
  readonly razonSocial = computed(
    () => this.offer()?.razon_social ?? this.scoring()?.razon_social ?? '',
  );
  readonly offerSegment = computed(
    () => this.offer()?.scoring?.segment ?? this.scoring()?.segment ?? '',
  );
  readonly offerSector = computed(
    () => this.offer()?.scoring?.sector ?? this.scoring()?.sector ?? null,
  );
  readonly cupoBaseMin = computed(() => this.offer()?.scoring?.cupo_base_min ?? 0);
  readonly cupoBaseMax = computed(() => this.offer()?.scoring?.cupo_base_max ?? 0);
  readonly deudaActiva = computed(() => this.offer()?.breakdown?.deuda_activa ?? 0);
  readonly cupoBase = computed(() => this.offer()?.breakdown?.cupo_base ?? 0);

  // ── New offer fields ─────────────────────────────────────────────────────
  readonly productsRecommended = computed(() => this.offer()?.products_recommended ?? []);
  readonly offerMessage = computed(() => this.offer()?.message ?? null);
  readonly expiresAt = computed(() => this.offer()?.expires_at ?? null);

  /**
   * The product to send to /accept. Prefers the 'principal' role; falls back
   * to the first credito-type product, then any product in the list.
   */
  readonly creditProduct = computed(() => {
    const list = this.productsRecommended();
    return (
      list.find((p) => p.role === 'principal') ??
      list.find((p) => p.product.type?.toLowerCase() === 'credito') ??
      list[0] ??
      null
    );
  });

  // ── Scoring context (prefer offer-embedded; fallback to separate endpoint) ─
  readonly scoringCtx = computed(() => {
    const o = this.offer();
    if (o) {
      return {
        score_base: o.scoring?.score_base ?? 0,
        segment: o.scoring?.segment ?? '',
        components: o.scoring?.components ?? [],
        cupo_base: o.breakdown?.cupo_base ?? 0,
        cupo_base_min: o.scoring?.cupo_base_min ?? 0,
        cupo_base_max: o.scoring?.cupo_base_max ?? 0,
        deuda_activa: o.breakdown?.deuda_activa ?? 0,
      };
    }
    const s = this.scoring();
    if (s) {
      return {
        score_base: s.score_base,
        segment: s.segment,
        components: s.components,
        cupo_base: s.cupo_base,
        cupo_base_min: s.cupo_base_min,
        cupo_base_max: s.cupo_base_max,
        deuda_activa: s.deuda_activa,
      };
    }
    return null;
  });

  readonly analyzingSteps = [
    { icon: 'analytics', label: 'Calculando score base con tus componentes' },
    { icon: 'event_repeat', label: 'Detectando contexto temporal vigente' },
    { icon: 'public', label: 'Cruzando con eventos de tu zona' },
    { icon: 'shield', label: 'Aplicando cap regulatorio (×1.6)' },
  ];

  ngOnInit(): void {
    this.start();
  }

  start(): void {
    this.stage.set('analyzing');
    this.errorMessage.set('');
    this.showScoreDetail.set(false);
    this.otpValue.set('');
    this.otpError.set(null);
    this.svc.reset();

    // Fire context endpoints in parallel (for the analyze animation),
    // then request the offer. Each context call is individually resilient —
    // the offer embeds the same data so a failure here is not fatal.
    this.svc.loadFullContext().subscribe({
      next: () => {
        this.svc.computeOffer({ persist: true, enable_ai_narrative: true }).subscribe({
          next: () => {
            this.selectedAmount.set(this.cupoFinal());
            this.stage.set('offer');
          },
          error: (err) => this.handleError(err),
        });
      },
      error: (err) => this.handleError(err),
    });
  }

  onAmountChange(value: number | string): void {
    this.selectedAmount.set(Number(value));
  }

  /** Step 1 — accept the offer and request an OTP via email. */
  confirmDisbursement(): void {
    const o = this.offer();
    if (!o?.offer_id) {
      this.handleError(new Error('La oferta no tiene un identificador válido.'));
      return;
    }
    const product = this.creditProduct();
    if (!product?.product?.id) {
      this.handleError(new Error('No se encontró un producto de crédito disponible.'));
      return;
    }
    this.stage.set('accepting');
    this.svc
      .acceptOffer({ offer_id: o.offer_id, amount: this.selectedAmount(), product_id: product.product.id })
      .subscribe({
        next: (res) => {
          this.otpValue.set('');
          this.otpError.set(null);
          this.startOtpCountdown(res.otp_expires_in_seconds ?? 300);
          this.stage.set('otp');
        },
        error: (err) => this.handleError(err),
      });
  }

  onOtpInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    // Keep only digits, max 6
    this.otpValue.set(raw.replace(/\D/g, '').slice(0, 6));
  }

  /** Step 2 — validate OTP and finalise disbursement. */
  submitOtp(): void {
    const acceptRes = this.acceptData();
    if (!acceptRes?.offer_id) return;

    const otp = this.otpValue().trim();
    if (otp.length < 4) {
      this.otpError.set('Ingresa el código completo de 6 dígitos.');
      return;
    }
    this.otpError.set(null);
    this.stage.set('confirming');

    this.svc.confirmOffer({ offer_id: acceptRes.offer_id, otp }).subscribe({
      next: () => {
        this.stopOtpCountdown();
        this.stage.set('done');
      },
      error: (err) => {
        this.stage.set('otp');
        const msg =
          (err as { error?: { Message?: string } })?.error?.Message ??
          (err as { message?: string })?.message ??
          'Código incorrecto o expirado. Inténtalo de nuevo.';
        this.otpError.set(msg);
      },
    });
  }

  resetFlow(): void {
    this.stopOtpCountdown();
    this.start();
  }

  private startOtpCountdown(seconds: number): void {
    this.stopOtpCountdown();
    this.otpSecondsLeft.set(seconds);
    this.countdownInterval = setInterval(() => {
      const current = this.otpSecondsLeft();
      if (current <= 1) {
        this.stopOtpCountdown();
      } else {
        this.otpSecondsLeft.set(current - 1);
      }
    }, 1000);
  }

  private stopOtpCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopOtpCountdown();
  }

  segmentLabel(segment?: string | null): string {
    if (!segment) return 'Estándar';
    const map: Record<string, string> = {
      premium: 'Premium',
      standard: 'Estándar',
      basic: 'Básico',
    };
    return map[segment.toLowerCase()] ?? segment;
  }

  prettyName(name: string): string {
    return name.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  }

  productIcon(type: string): string {
    const icons: Record<string, string> = {
      inversion: 'savings',
      credito: 'credit_card',
      cuenta: 'account_balance',
    };
    return icons[type?.toLowerCase()] ?? 'storefront';
  }

  hasContext(): boolean {
    return !!this.offer() || !!this.scoring() || !!this.calendar() || !!this.geo();
  }

  private handleError(err: unknown): void {
    const msg =
      (err as { message?: string } | null)?.message ??
      'No fue posible completar la operación con el agente Nexo.';
    this.errorMessage.set(msg);
    this.stage.set('error');
  }
}
