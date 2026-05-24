import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="card" [class.card--interactive]="interactive" [class.card--flush]="flush">
    <ng-content />
  </div>`,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .card {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        background-color: var(--color-surface-container-lowest);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-outline-variant);
        box-shadow: var(--shadow-card);
        padding: var(--space-6);
        transition:
          transform var(--duration-base) var(--ease-emphasized),
          box-shadow var(--duration-base) var(--ease-emphasized),
          border-color var(--duration-base) var(--ease-emphasized);
      }
      .card--flush {
        padding: 0;
        overflow: hidden;
      }
      .card--interactive {
        cursor: pointer;
      }
      .card--interactive:hover {
        transform: translateY(-2px);
        box-shadow:
          0 2px 4px rgba(15, 23, 42, 0.04),
          0 12px 28px rgba(15, 23, 42, 0.08);
        border-color: rgba(7, 0, 83, 0.18);
      }
    `,
  ],
})
export class CardComponent {
  @Input() interactive = false;
  @Input() flush = false;
}
