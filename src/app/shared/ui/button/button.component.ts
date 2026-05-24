import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tonal';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="'btn btn--' + variant + ' btn--' + size + (block ? ' btn--block' : '')"
    >
      @if (loading) {
        <span class="btn__spinner" aria-hidden="true"></span>
      } @else if (icon) {
        <app-icon [name]="icon" [size]="iconSize" />
      }
      <span class="btn__label"><ng-content /></span>
      @if (iconRight && !loading) {
        <app-icon [name]="iconRight" [size]="iconSize" />
      }
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() icon?: string;
  @Input() iconRight?: string;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() block = false;

  get iconSize(): number {
    return this.size === 'lg' ? 22 : this.size === 'sm' ? 16 : 18;
  }
}
