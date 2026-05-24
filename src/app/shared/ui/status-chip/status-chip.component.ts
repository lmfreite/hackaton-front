import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type ChipTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [class]="'chip--' + tone">
    @if (icon) { <app-icon [name]="icon" [size]="14" /> }
    <ng-content />
  </span>`,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: var(--radius-full);
        font-family: var(--font-body);
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0.01em;
        white-space: nowrap;
        animation: fade-in var(--duration-fast) var(--ease-standard) both;
      }
      .chip--success { background: var(--color-success-container); color: var(--color-success); }
      .chip--warning { background: var(--color-warning-container); color: var(--color-warning); }
      .chip--error { background: var(--color-error-container); color: var(--color-on-error-container); }
      .chip--info { background: var(--color-info-container); color: var(--color-info); }
      .chip--neutral { background: var(--color-surface-container); color: var(--color-on-surface-variant); }
      .chip--primary { background: rgba(7, 0, 83, 0.08); color: var(--color-primary); }
    `,
  ],
})
export class StatusChipComponent {
  @Input() tone: ChipTone = 'neutral';
  @Input() icon?: string;
}
