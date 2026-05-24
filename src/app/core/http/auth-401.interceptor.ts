import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Intercepts 401 Unauthorized responses that occur while the user is
 * considered authenticated (i.e. the access token has expired mid-session).
 *
 * Flow:
 *  1. On 401 (non-auth endpoint, user believed authenticated):
 *     → call auth.refreshToken()  (POST /api/v1/auth/refresh with the
 *       HttpOnly refresh_token cookie the backend set at login)
 *  2. If refresh succeeds (backend rotates both cookies):
 *     → retry the original request — the new access-token cookie is sent
 *       automatically by the browser.
 *  3. If refresh also returns 401 (token missing, expired, or revoked):
 *     → call auth.sessionExpired() to clear in-memory state + cookies
 *     → redirect to /login?redirect=<current-url>
 *
 * Auth endpoints are excluded from both the 401 trigger and the retry to
 * avoid infinite loops.
 */
export const auth401Interceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        !isAuthEndpoint(req.url) &&
        auth.isAuthenticated()
      ) {
        // ── Attempt silent token refresh ───────────────────────────────────
        return auth.refreshToken().pipe(
          // Refresh succeeded: both cookies have been rotated by the backend.
          // Re-issue the original request — the browser will attach the new
          // access-token cookie automatically.
          switchMap(() => next(req)),

          // Refresh itself failed (401, network error, etc.).
          // The session is truly over — clean up and redirect.
          catchError(() => {
            auth.sessionExpired();

            const currentUrl = router.url;
            void router.navigate(['/login'], {
              queryParams:
                currentUrl && currentUrl !== '/' && currentUrl !== '/login'
                  ? { redirect: currentUrl }
                  : undefined,
              replaceUrl: true,
            });

            return throwError(() => err);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};

/**
 * Returns true for auth-related URLs that must never trigger a forced logout
 * or a refresh attempt — doing so would cause infinite loops.
 */
function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|logout|check|me|refresh)/.test(url);
}
