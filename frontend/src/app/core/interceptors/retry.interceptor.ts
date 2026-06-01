import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, take } from 'rxjs/operators';
import { NetworkService } from '../services/network.service';

const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

export const retryInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const networkService = inject(NetworkService);
  
  if (req.method === 'GET' && req.url.includes('/api/')) {
    return next(req).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            console.log(`[Retry] Request failed: ${req.url}, status: ${error.status}, attempt ${index + 1}`);
            // Don't retry if offline, no connection, or rate limited (429)
            if (index >= RETRY_COUNT || error.status === 0) {
              return throwError(() => error);
            }
            if (error.status === 429) {
              return throwError(() => error);
            }
            if (!networkService.isOnline()) {
              return throwError(() => error);
            }
            return timer(RETRY_DELAY * Math.pow(2, index));
          }),
          take(RETRY_COUNT + 1)
        )
      ),
      catchError((error: HttpErrorResponse) => {
        console.error('[Retry] All retries failed for:', req.url, error);
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
};