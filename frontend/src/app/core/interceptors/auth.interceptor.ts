import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const injector = inject(Injector);

  const token = localStorage.getItem('token');

  if (token && !isTokenExpired(token)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError(err => {
      if (err.status === 0) {
        const authService = injector.get(AuthService);
        authService.clearAuth();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      if (err.status === 401 && !router.url.startsWith('/admin')) {
        const authService = injector.get(AuthService);
        authService.clearAuth();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};