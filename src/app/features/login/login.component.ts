import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth">
      <section class="auth__panel">
        <div class="auth__brand">
          <img src="serfinanza.webp" alt="Serfinanza" class="auth__logo" />
        </div>

        <div class="auth__copy anim-fade-up">

          <!-- Announcement badge — voz de Serfinanza -->
          <div class="auth__announce">
            <span class="auth__announce-dot"></span>
            <span>Nuevo · Exclusivo para comercios activos</span>
          </div>

          <h1 class="auth__headline">
            <span class="auth__nexo-tag">
              <img src="nexo_logo_horizontal.webp" alt="Nexo" class="auth__nexo-logo" />
            </span>
            llegó a<br />Serfinanza.
          </h1>

          <p class="auth__sub">
            Si tienes una cuenta de ahorros empresarial activa, ya puedes acceder a
            capital de trabajo inteligente — calculado con tu historial real,
            sin llamadas y sin visitas a sucursal.
          </p>

          <ul class="auth__bullets">
            <li>
              <app-icon name="bolt" [size]="16" color="#00C2A8" />
              Cupo pre-aprobado listo en menos de 2 minutos
            </li>
            <li>
              <app-icon name="public" [size]="16" color="#00C2A8" />
              Ajustado a tu zona geográfica y la temporada actual
            </li>
            <li>
              <app-icon name="trending_up" [size]="16" color="#00C2A8" />
              La oferta llega antes de que la necesites
            </li>
            <li>
              <app-icon name="account_balance_wallet" [size]="16" color="#00C2A8" />
              Desembolso inmediato directo a tu cuenta
            </li>
          </ul>

          <!-- Partnership footer -->
          <div class="auth__partnership">
            <span>Una alianza estratégica</span>
            <div class="auth__partnership-row">
              <span class="auth__partnership-bank">Serfinanza</span>
              <span class="auth__partnership-sep">×</span>
              <img src="nexo_logo_horizontal.webp" alt="Nexo" class="auth__nexo-logo-sm" />
            </div>
          </div>

        </div>
      </section>

      <section class="auth__form-wrap">
        <form class="auth__form anim-fade-up anim-delay-2" (ngSubmit)="submit()">
          <header class="auth__form-head">
            <h2>Inicia sesión</h2>
            <p>Accede al panel de Distribuciones Vargas SAS</p>
          </header>

          <label class="field">
            <span class="field__label">Correo corporativo</span>
            <div class="field__control">
              <app-icon name="mail" [size]="18" color="var(--color-on-surface-variant)" />
              <input
                type="email"
                name="email"
                autocomplete="email"
                placeholder="rep.legal@pyme.com"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                required
                [disabled]="loading()"
              />
            </div>
          </label>

          <label class="field">
            <span class="field__label">Contraseña</span>
            <div class="field__control">
              <app-icon name="lock" [size]="18" color="var(--color-on-surface-variant)" />
              <input
                [type]="showPassword() ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                placeholder="Mínimo 12 caracteres"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
                minlength="12"
                required
                [disabled]="loading()"
              />
              <button
                type="button"
                class="field__toggle"
                (click)="toggleShow()"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <app-icon
                  [name]="showPassword() ? 'visibility_off' : 'visibility'"
                  [size]="18"
                  color="var(--color-on-surface-variant)"
                />
              </button>
            </div>
          </label>

          @if (showTwoFA()) {
            <label class="field">
              <span class="field__label">Código 2FA</span>
              <div class="field__control">
                <app-icon name="pin" [size]="18" color="var(--color-on-surface-variant)" />
                <input
                  type="text"
                  inputmode="numeric"
                  name="twofa"
                  placeholder="6 dígitos"
                  [ngModel]="twoFA()"
                  (ngModelChange)="twoFA.set($event)"
                  [disabled]="loading()"
                />
              </div>
            </label>
          }

          @if (errorMessage()) {
            <div class="auth__error anim-fade-up">
              <app-icon name="error" [size]="18" />
              {{ errorMessage() }}
            </div>
          }

          <app-button
            type="submit"
            variant="primary"
            icon="login"
            [loading]="loading()"
            [disabled]="!canSubmit()"
          >
            Iniciar sesión
          </app-button>

          <div class="auth__demo">
            <span>Demo Hackaton 2026</span>
            <button type="button" class="auth__demo-link" (click)="fillDemo()">
              Usar credenciales demo
            </button>
          </div>
        </form>

        <footer class="auth__footer">
          <span>© 2026 Banco Serfinanza · Nexo Salvavidas</span>
          <a href="#" class="auth__link">Política de privacidad</a>
        </footer>
      </section>
    </main>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly email = signal('');
  readonly password = signal('');
  readonly twoFA = signal('');

  readonly showPassword = signal(false);
  readonly showTwoFA = signal(false);

  readonly loading = this.auth.loading;
  readonly errorMessage = this.auth.error;

  readonly canSubmit = computed(
    () => this.email().trim().length > 3 && this.password().length >= 12 && !this.loading(),
  );

  toggleShow(): void {
    this.showPassword.update((v) => !v);
  }

  fillDemo(): void {
    this.email.set('demo@nexo.dev');
    this.password.set('NexoDemo2026!');
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.auth
      .login({
        Email: this.email().trim(),
        Password: this.password(),
        TwoFACode: this.twoFA() || null,
      })
      .subscribe({
        next: () => {
          const redirect = this.route.snapshot.queryParamMap.get('redirect');
          this.router.navigateByUrl(redirect && redirect !== '/login' ? redirect : '/dashboard');
        },
        error: (err: Error) => {
          if (/2FA|two[- ]factor/i.test(err.message)) {
            this.showTwoFA.set(true);
          }
        },
      });
  }
}
