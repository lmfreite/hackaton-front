import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class.badge--pulse]="pulse">
    @if (icon) { <app-icon [name]="icon" [size]="16" [color]="iconColor" /> }
    <span class="badge__text">
      <small class="badge__label">{{ label }}</small>
      <strong class="badge__value">{{ value }}</strong>
    </span>
  </span>`,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: 10px 14px;
        background: rgba(7, 0, 83, 0.06);
        border: 1px solid rgba(7, 0, 83, 0.12);
        border-radius: var(--radius-lg);
        color: var(--color-primary);
        transition: transform var(--duration-fast) var(--ease-standard);
        animation: fade-up var(--duration-base) var(--ease-emphasized) both;
      }
      .badge:hover { transform: translateY(-1px); }
      .badge__text { display: flex; flex-direction: column; line-height: 1.1; }
      .badge__label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--color-on-surface-variant);
      }
      .badge__value { font-size: 13px; font-weight: 600; color: var(--color-primary); }
      .badge--pulse::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-secondary);
        animation: pulse-soft 1.8s var(--ease-standard) infinite;
      }
    `,
  ],
})
export class BadgeComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() pulse = false;
}
