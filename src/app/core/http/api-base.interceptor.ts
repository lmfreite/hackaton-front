import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Prefixes relative URLs with the Nexo API base URL and ensures every request
 * sends session cookies. Absolute URLs are passed through untouched.
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const isAbsolute = /^https?:\/\//i.test(req.url);
  const url = isAbsolute ? req.url : `${environment.apiBaseUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`;

  const cloned: HttpRequest<unknown> = req.clone({
    url,
    withCredentials: true,
  });

  return next(cloned);
};
