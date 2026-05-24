import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="skeleton"
    [style.width]="width"
    [style.height]="height"
    [style.border-radius]="rounded"
  ></span>`,
  styles: [
    `
      :host { display: inline-block; }
      .skeleton {
        display: inline-block;
        background: linear-gradient(
          90deg,
          var(--color-surface-container) 0%,
          var(--color-surface-container-high) 50%,
          var(--color-surface-container) 100%
        );
        background-size: 800px 100%;
        animation: shimmer 1.4s linear infinite;
        will-change: background-position;
      }
    `,
  ],
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '14px';
  @Input() rounded = 'var(--radius-md)';
}
