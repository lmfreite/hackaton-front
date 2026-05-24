import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="search">
        <app-icon name="search" [size]="20" color="var(--color-on-surface-variant)" />
        <input
          type="search"
          placeholder="Buscar transacciones, cuentas o contactos…"
          aria-label="Buscar"
        />
        <kbd class="search__kbd">⌘K</kbd>
      </div>

      <div class="topbar__actions">
        <button class="icon-btn" aria-label="Notificaciones">
          <app-icon name="notifications" [size]="22" />
          <span class="icon-btn__dot"></span>
        </button>
        <button class="icon-btn" aria-label="Historial">
          <app-icon name="history" [size]="22" />
        </button>

        <app-button variant="primary" icon="add" routerLink="/transferencias">
          Nueva transacción
        </app-button>

        <div
          class="profile"
          (click)="toggleMenu()"
          (keydown.enter)="toggleMenu()"
          role="button"
          tabindex="0"
        >
          <div class="profile__info">
            <span class="profile__name">{{ fullName() }}</span>
            <span class="profile__role">{{ subtitle() }}</span>
          </div>
          <div class="profile__avatar" aria-hidden="true">{{ initials() }}</div>

          @if (menuOpen()) {
            <div class="profile__menu anim-fade-up" (click)="$event.stopPropagation()">
              <header class="profile__menu-head">
                <strong>{{ fullName() }}</strong>
                <span>{{ email() }}</span>
              </header>
              <button class="profile__menu-item" type="button" (click)="logout()">
                <app-icon name="logout" [size]="18" />
                Cerrar sesión
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);

  readonly fullName = computed(
    () => this.auth.user()?.Fullname ?? 'Carlos Vargas',
  );
  readonly email = computed(() => this.auth.user()?.Email ?? '—');
  readonly subtitle = computed(() =>
    this.auth.user() ? 'Rep. Legal · Pyme Nexo' : 'Rep. Legal · Dist. Vargas SAS',
  );
  readonly initials = computed(() => {
    const name = this.fullName().trim();
    if (!name) return 'CV';
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? '');
    return (first + last).toUpperCase();
  });

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
