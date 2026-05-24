import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { StandardResponse } from '../models/api.model';
import {
  AuthStatusResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  UserResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<UserResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _ready = signal(false);

  /**
   * Shared in-flight refresh observable — ensures that when multiple requests
   * fail with 401 simultaneously, only ONE refresh HTTP call is fired.
   * Cleared (set to null) as soon as the call settles (success or error).
   */
  private refreshTokenObs$: Observable<boolean> | null = null;

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  /**
   * Logs in via the Nexo session-cookie scheme. The backend sets the HttpOnly
   * session cookie and the `csrftoken` cookie that our CSRF interceptor uses
   * for subsequent mutating requests.
   */
  login(payload: LoginRequest): Observable<UserResponse> {
    this._loading.set(true);
    this._error.set(null);
    // Clear any stale session cookies BEFORE sending credentials so the
    // backend login endpoint never sees an expired/invalid csrftoken or
    // session cookie from a previous session.
    this.clearBrowserCookies();
    return this.http
      .post<unknown>('/api/v1/auth/login', payload)
      .pipe(
        tap((res) => {
          // The backend returns HTTP 4xx on failure (Angular throws automatically).
          // On HTTP 200 we trust the server — but guard against explicit Success:false
          // payloads that some FastAPI middleware returns even on 200.
          const body = res as Record<string, unknown>;
          const isExplicitFailure =
            'Success' in body && body['Success'] === false;
          if (isExplicitFailure) {
            const msg =
              (body['Message'] as string | undefined) ??
              ((body['Data'] as Record<string, unknown> | undefined)?.['Message'] as string | undefined) ??
              'Credenciales inválidas';
            throw new Error(msg);
          }
        }),
        switchMap(() => this.me()),
        tap(() => this._loading.set(false)),
        catchError((err: unknown) => {
          const message = this.extractMessage(err, 'No fue posible iniciar sesión');
          this._error.set(message);
          this._loading.set(false);
          return throwError(() => new Error(message));
        }),
      );
  }

  /** Loads the currently authenticated user profile. */
  me(): Observable<UserResponse> {
    return this.http
      .get<unknown>('/api/v1/auth/me')
      .pipe(
        map((res) => {
          // Unwrap StandardResponse envelope if present, otherwise use as-is.
          const body = res as Record<string, unknown>;
          return ('Data' in body ? body['Data'] : body) as UserResponse;
        }),
        tap((user) => this._user.set(user)),
        catchError((err: unknown) => {
          this._user.set(null);
          return throwError(() => err);
        }),
      );
  }

  /** Lightweight session check; safe to call on app boot. */
  check(): Observable<boolean> {
    return this.http
      .get<StandardResponse<AuthStatusResponse>>('/api/v1/auth/check')
      .pipe(
        map((res) => !!res.Data?.Authenticated),
        catchError(() => of(false)),
      );
  }

  /**
   * Called once on application bootstrap to attempt session rehydration.
   * Sets `ready()` to true once the attempt completes (success or failure).
   */
  bootstrap(): Observable<boolean> {
    return this.me().pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(() => this._ready.set(true)),
    );
  }

  logout(): Observable<LogoutResponse> {
    return this.http
      .post<StandardResponse<LogoutResponse>>('/api/v1/auth/logout', {})
      .pipe(
        map((res) => res.Data),
        tap(() => this._user.set(null)),
        catchError((err: unknown) => {
          // Even on failure, drop the local user — they cannot use the app anyway.
          this._user.set(null);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Issues a silent token refresh via the `refresh_token` HttpOnly cookie that
   * the backend set at login time.
   *
   * Deduplication: if a refresh is already in flight (e.g. multiple concurrent
   * requests all 401'd), every caller subscribes to the same observable so only
   * ONE network call is made. The shared observable is cleared once it settles.
   *
   * Returns `true` when the backend confirms `Authenticated: true`, throws on
   * any network or 401 error.
   */
  refreshToken(): Observable<boolean> {
    if (!this.refreshTokenObs$) {
      this.refreshTokenObs$ = this.http
        .post<StandardResponse<{ Authenticated: boolean }>>(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true },
        )
        .pipe(
          map((res) => res?.Data?.Authenticated === true),
          tap(() => { this.refreshTokenObs$ = null; }),
          catchError((err) => {
            this.refreshTokenObs$ = null;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.refreshTokenObs$;
  }

  /**
   * Called by the 401 interceptor when a token-expired response is detected
   * mid-session. Immediately clears in-memory state, deletes browser-accessible
   * cookies (csrftoken), and fires a best-effort POST /auth/logout so the backend
   * can respond with Set-Cookie headers to clear HttpOnly session cookies too.
   *
   * Navigation to /login is handled by the interceptor itself.
   */
  sessionExpired(): void {
    this._user.set(null);
    this._ready.set(false);
    // Surface a clear reason on the login page without using the raw API error.
    this._error.set('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');

    // Delete browser-readable cookies immediately (synchronous, runs before redirect).
    this.clearBrowserCookies();

    // Best-effort: ask the server to clear any HttpOnly session cookie via Set-Cookie.
    // We swallow errors because local state is already cleaned up.
    this.http
      .post('/api/v1/auth/logout', {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  /**
   * Deletes browser-accessible (non-HttpOnly) session cookies synchronously.
   * Tries multiple domain/path combinations to ensure the cookie is removed
   * regardless of how the backend's proxy set it.
   *
   * HttpOnly cookies cannot be deleted from JS — those require the server to
   * respond with Set-Cookie: name=; Max-Age=0, which our logout call handles.
   */
  private clearBrowserCookies(): void {
    if (typeof document === 'undefined') return;

    const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const hostname =
      typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    // Cookie names used by the Nexo backend (Django: csrftoken + sessionid)
    const names = ['csrftoken', 'sessionid'];

    // Try all combinations: with domain, without, with/without leading dot
    const domains = ['', hostname, `.${hostname}`];
    const paths = ['/', ''];

    for (const name of names) {
      for (const domain of domains) {
        for (const path of paths) {
          const parts = [
            `${name}=`,
            `expires=${expire}`,
            `path=${path || '/'}`,
          ];
          if (domain) parts.push(`domain=${domain}`);
          document.cookie = parts.join('; ');
        }
      }
    }
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      // Top-level Message (StandardResponse)
      if (body?.Message) return body.Message;
      // Nexo error envelope: { detail: { Message, Error_code } }
      if (body?.detail && typeof body.detail === 'object' && !Array.isArray(body.detail)) {
        if (body.detail.Message) return body.detail.Message;
      }
      // FastAPI validation errors: { detail: string } or { detail: [{msg}] }
      if (body?.detail) {
        if (typeof body.detail === 'string') return body.detail;
        if (Array.isArray(body.detail)) {
          return body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(' · ');
        }
      }
      if (err.status === 0) return 'No pudimos contactar el servidor. Verifica tu conexión.';
      if (err.status === 401) return 'Credenciales incorrectas. Verifica tu email y contraseña.';
      if (err.status === 429) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    }
    if (err instanceof Error) return err.message || fallback;
    return fallback;
  }
}
