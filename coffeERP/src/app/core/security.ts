import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Nunca enviar el JWT a PayPal, al correo ni a otro dominio.
  const local = req.url.startsWith('/api/');
  const secured =
    local && auth.token()
      ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } })
      : req;
  return next(secured).pipe(
    catchError((error: HttpErrorResponse) => {
      if (local && error.status === 401 && !req.url.endsWith('/login')) {
        auth.logout();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService),
    router = inject(Router);
  return auth.user() || (await auth.restore()) ? true : router.createUrlTree(['/login']);
};
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService),
    router = inject(Router);
  if (!auth.user()) await auth.restore();
  return auth.user()?.role === 'ADMIN' ? true : router.createUrlTree(['/ventas']);
};
