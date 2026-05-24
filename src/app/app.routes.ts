import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'Inicia sesión · Serfinanza Nexo',
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Resumen · Serfinanza Nexo',
      },
      {
        path: 'salvavidas',
        loadComponent: () =>
          import('./features/salvavidas/salvavidas.component').then((m) => m.SalvavidasComponent),
        title: 'Salvavidas Pyme · Powered by Nexo',
      },
      {
        path: 'transferencias',
        loadComponent: () =>
          import('./features/transfers/transfers.component').then((m) => m.TransfersComponent),
        title: 'Transferencias · Serfinanza Nexo',
      },
      {
        path: 'recibos',
        loadComponent: () =>
          import('./features/receipts/receipts.component').then((m) => m.ReceiptsComponent),
        title: 'Recibos · Serfinanza Nexo',
      },
      {
        path: 'cuentas',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then((m) => m.AccountsComponent),
        title: 'Cuentas · Serfinanza Nexo',
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then((m) => m.AccountsComponent),
        title: 'Ajustes · Serfinanza Nexo',
      },
      {
        path: 'soporte',
        loadComponent: () =>
          import('./features/accounts/accounts.component').then((m) => m.AccountsComponent),
        title: 'Soporte · Serfinanza Nexo',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
