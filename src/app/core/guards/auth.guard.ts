import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Protects routes behind authentication. If the in-memory user signal is
 * already populated, we let the navigation through synchronously; otherwise
 * we attempt a single `/auth/me` rehydration before deciding.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return auth.bootstrap().pipe(
    map((ok) => {
      if (ok) return true;
      return router.createUrlTree(['/login'], {
        queryParams: state.url && state.url !== '/' ? { redirect: state.url } : undefined,
      });
    }),
  );
};

/** Inverse guard: keeps already-authenticated users away from /login. */
export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  return auth.bootstrap().pipe(
    map((ok) => (ok ? router.createUrlTree(['/dashboard']) : true)),
  );
};
