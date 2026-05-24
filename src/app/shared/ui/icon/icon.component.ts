import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="material-symbols-outlined"
    [style.font-size.px]="size"
    [style.color]="color"
    [attr.aria-hidden]="true"
    >{{ name }}</span
  >`,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
      span {
        transition: transform var(--duration-fast) var(--ease-standard),
          color var(--duration-fast) var(--ease-standard);
      }
    `,
  ],
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size = 20;
  @Input() color?: string;
}
