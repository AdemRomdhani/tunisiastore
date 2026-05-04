import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
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
  const token = localStorage.getItem('token');
  const router = inject(Router);
  const authService = inject(AuthService);

  if (token && !isTokenExpired(token)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else if (token && isTokenExpired(token)) {
    authService.clearAuth();
  }

  return next(req).pipe(
    catchError(err => {
      // Server is completely down / network error
      if (err.status === 0) {
        authService.clearAuth();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      // Only logout on 401 for non-admin routes
      if (err.status === 401 && !router.url.startsWith('/admin')) {
        authService.clearAuth();
        router.navigate(['/login']);
      }
      // On admin routes with 401, don't logout - just throw the error
      return throwError(() => err);
    })
  );
};