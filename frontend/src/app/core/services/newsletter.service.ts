import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

export interface NewsletterResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private apiUrl = `${environment.apiUrl}/newsletter`;

  constructor(private http: HttpClient) {}

  subscribe(email: string): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(`${this.apiUrl}/subscribe`, { email }).pipe(
      catchError(error => {
        let errorMessage = 'Une erreur est survenue';
        
        // Handle HTTP error response from API
        if (error.error) {
          // API returned error response body
          if (typeof error.error === 'object' && error.error !== null) {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error && error.error.error.message) {
              errorMessage = error.error.error.message;
            }
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  unsubscribe(email: string): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(`${this.apiUrl}/unsubscribe`, { email }).pipe(
      catchError(error => {
        let errorMessage = 'Une erreur est survenue';
        
        // Handle HTTP error response from API
        if (error.error) {
          // API returned error response body
          if (typeof error.error === 'object' && error.error !== null) {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error && error.error.error.message) {
              errorMessage = error.error.error.message;
            }
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}