import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: 'IA' | 'Nuevo' | 'Nexo';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <img src="serfinanza.webp" alt="Serfinanza" class="sidebar__logo-img" />
      </div>

      <nav class="sidebar__nav" aria-label="Navegación principal">
        @for (item of items; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="is-active"
            class="nav-item"
          >
            <span class="nav-item__rail"></span>
            <app-icon [name]="item.icon" [size]="20" />
            <span class="nav-item__label">{{ item.label }}</span>
            @if (item.badge) {
              <span class="nav-item__badge">{{ item.badge }}</span>
            }
          </a>
        }
      </nav>

      <div class="sidebar__footer">
        <a routerLink="/ajustes" routerLinkActive="is-active" class="nav-item nav-item--minor">
          <span class="nav-item__rail"></span>
          <app-icon name="settings" [size]="20" />
          <span class="nav-item__label">Ajustes</span>
        </a>
        <a routerLink="/soporte" routerLinkActive="is-active" class="nav-item nav-item--minor">
          <span class="nav-item__rail"></span>
          <app-icon name="help" [size]="20" />
          <span class="nav-item__label">Soporte</span>
        </a>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly items: NavItem[] = [
    { label: 'Resumen',         route: '/dashboard',     icon: 'dashboard' },
    { label: 'Transacciones',   route: '/transacciones', icon: 'receipt_long' },
    { label: 'Salvavidas Pyme', route: '/salvavidas',    icon: 'health_and_safety', badge: 'Nexo' },
  ];
}
