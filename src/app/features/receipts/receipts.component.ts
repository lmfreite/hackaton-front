import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '../../shared/ui/card/card.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [CardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="placeholder">
      <h1>Recibos</h1>
      <p>Descarga y archiva los comprobantes fiscales de tus operaciones.</p>
      <app-card class="placeholder__card">
        <app-icon name="receipt_long" [size]="48" color="var(--color-primary)" />
        <h2>Próximamente</h2>
        <p>Generación automática de comprobantes en PDF integrada con tu facturación.</p>
      </app-card>
    </section>
  `,
  styles: [
    `
      .placeholder { display: flex; flex-direction: column; gap: var(--space-5); animation: fade-up var(--duration-base) var(--ease-emphasized) both; }
      h1 { margin: 0; font-family: var(--font-display); font-size: 32px; font-weight: 600; letter-spacing: -0.01em; }
      p { margin: 0; color: var(--color-on-surface-variant); }
      .placeholder__card { text-align: center; padding: var(--space-9) var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
      h2 { margin: 0; font-family: var(--font-display); font-size: 22px; font-weight: 600; }
    `,
  ],
})
export class ReceiptsComponent {}
