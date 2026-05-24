import { HttpInterceptorFn } from '@angular/common/http';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Reads the CSRF token from the `csrftoken` cookie set by the backend on login
 * and attaches it as the `X-CSRF-Token` header on every mutating request.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!MUTATING.has(req.method.toUpperCase())) {
    return next(req);
  }

  const token = readCookie('csrftoken');
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'X-CSRF-Token': token },
    }),
  );
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .map((entry) => entry.split('='))
    .find(([key]) => key === name);
  return match ? decodeURIComponent(match[1]) : null;
}
