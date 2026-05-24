import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { DashboardService, DashboardOverview } from '../../core/services/dashboard.service';
import { Transaction, AccountSummary } from '../../core/models/transaction.model';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { StatusChipComponent } from '../../shared/ui/status-chip/status-chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { ShortDateEsPipe } from '../../shared/pipes/short-date.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    CardComponent,
    ButtonComponent,
    StatusChipComponent,
    IconComponent,
    SkeletonComponent,
    CurrencyCopPipe,
    ShortDateEsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private accountSvc = inject(AccountService);
  private dashboardSvc = inject(DashboardService);

  readonly account = signal<AccountSummary | null>(null);
  readonly transactions = signal<Transaction[]>([]);
  readonly loadingAccount = signal(true);
  readonly loadingTx = signal(true);

  // ── Real overview data from the Nexo API ──────────────────────────────────
  readonly overviewData = this.dashboardSvc.overview;

  readonly razonSocial = computed(() => this.overviewData()?.razon_social ?? null);
  readonly aiSummary = computed(() => this.overviewData()?.ai_summary ?? null);
  readonly offerCupo = computed(() => this.overviewData()?.offer?.cupo_final ?? null);
  readonly offerTermDays = computed(() => this.overviewData()?.offer?.term_days ?? null);
  readonly offerRateEA = computed(() => {
    const r = this.overviewData()?.offer?.rate_ea;
    return r != null ? Number(r) * 100 : null;
  });
  readonly ratePreferential = computed(() => this.overviewData()?.offer?.rate_preferential ?? false);
  readonly rateDiscountPct = computed(() => this.overviewData()?.offer?.rate_discount_pct ?? null);

  ngOnInit(): void {
    // Try the real Nexo dashboard overview first; if it fails (or shape is partial),
    // fall back to the local mock so the demo never shows empty state.
    this.dashboardSvc.getOverview().subscribe((remote) => {
      if (remote && Object.keys(remote).length > 0) {
        this.account.set(this.mapOverview(remote));
        this.loadingAccount.set(false);
      } else {
        this.accountSvc.getAccount().subscribe((a) => {
          this.account.set(a);
          this.loadingAccount.set(false);
        });
      }
    });

    this.accountSvc.getRecentTransactions().subscribe((tx) => {
      this.transactions.set(tx);
      this.loadingTx.set(false);
    });
  }

  /**
   * Coerces the overview payload into the AccountSummary shape consumed by
   * the dashboard template. Real KPI fields take priority over legacy fields.
   */
  private mapOverview(o: DashboardOverview): AccountSummary {
    const num = (v: unknown, fallback: number) =>
      v === null || v === undefined ? fallback : Number(v);
    const kpis = o.kpis;
    return {
      numeroCuenta: String(o.numero_cuenta ?? 'SRF-4012-7890-06'),
      // net_cashflow_30d = income − expense → use as the "saldo" proxy
      saldoTotal: kpis
        ? num(kpis.net_cashflow_30d, num(o.saldo_total, 8_742_350))
        : num(o.saldo_total, 8_742_350),
      moneda: String(o.moneda ?? 'COP'),
      variacionPct: num(o['variacion_pct'], 3.1),
      gastosMensuales: kpis
        ? num(kpis.total_expense_30d, num(o['gastos_mensuales'], 4_180_000))
        : num(o['gastos_mensuales'], 4_180_000),
      variacionGastosPct: num(o['variacion_gastos_pct'], -1.8),
      aprobacionesPendientes: num(o['aprobaciones_pendientes'], 2),
    };
  }

  chipTone(status: string): 'success' | 'warning' | 'error' {
    if (status === 'completada') return 'success';
    if (status === 'pendiente') return 'warning';
    return 'error';
  }

  chipIcon(status: string): string {
    if (status === 'completada') return 'check_circle';
    if (status === 'pendiente') return 'schedule';
    return 'error';
  }

  statusLabel(status: string): string {
    if (status === 'completada') return 'Completada';
    if (status === 'pendiente') return 'Pendiente';
    return 'Rechazada';
  }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K';
    return value.toString();
  }
}
