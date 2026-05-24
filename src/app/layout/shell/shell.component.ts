import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-sidebar />
      <div class="shell__main">
        <app-topbar />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        display: flex;
        min-height: 100vh;
        background: var(--color-background);
      }
      .shell__main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .shell__content {
        flex: 1;
        padding: var(--space-7) var(--margin-desktop);
        max-width: var(--container-max);
        width: 100%;
        margin: 0 auto;
        animation: fade-up var(--duration-base) var(--ease-emphasized) both;
      }
      @media (max-width: 900px) {
        .shell__content { padding: var(--space-5) var(--margin-mobile); }
      }
    `,
  ],
})
export class ShellComponent {}
