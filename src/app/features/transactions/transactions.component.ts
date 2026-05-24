import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardComponent } from '../../shared/ui/card/card.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { StatusChipComponent } from '../../shared/ui/status-chip/status-chip.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

import { TransactionService } from '../../core/services/transaction.service';
import { TransactionFilters, TransactionItem } from '../../core/models/transaction.model';
import { ChipTone } from '../../shared/ui/status-chip/status-chip.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    CardComponent,
    ButtonComponent,
    IconComponent,
    StatusChipComponent,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private readonly svc = inject(TransactionService);

  readonly loading    = this.svc.loading;
  readonly txs        = this.svc.transactions;
  readonly page       = this.svc.currentPage;
  readonly hasMore    = this.svc.hasMore;

  readonly filterType   = signal<string>('');
  readonly filterStatus = signal<string>('');
  readonly filterSearch = signal<string>('');

  /** Running totals for the current page. */
  readonly totals = computed(() => {
    let inc = 0, out = 0;
    for (const t of this.txs()) {
      const n = Number(t.amount) || 0;
      t.type === 'ingreso' ? (inc += n) : (out += n);
    }
    return { inc, out, net: inc - out };
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(1); }

  load(page: number): void {
    const f: TransactionFilters = {
      page,
      size: this.svc.PAGE_SIZE,
      type:   this.filterType()   || null,
      status: this.filterStatus() || null,
      search: this.filterSearch() || null,
    };
    this.svc.list(f).subscribe();
  }

  setType(t: string): void   { this.filterType.set(t);   this.load(1); }
  setStatus(s: string): void { this.filterStatus.set(s); this.load(1); }

  onSearch(val: string): void {
    this.filterSearch.set(val);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(1), 380);
  }

  prev(): void { if (this.page() > 1) this.load(this.page() - 1); }
  next(): void { if (this.hasMore()) this.load(this.page() + 1); }

  isIngreso(t: TransactionItem): boolean { return t.type === 'ingreso'; }

  statusTone(s: string): ChipTone {
    const m: Record<string, ChipTone> = {
      posted: 'success', pending: 'warning', reversed: 'info', failed: 'error',
    };
    return m[s] ?? 'neutral';
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      posted: 'Liquidada', pending: 'Pendiente', reversed: 'Reversada', failed: 'Fallida',
    };
    return m[s] ?? s;
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }
}
