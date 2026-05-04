import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getProductReviews(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product/${productId}`);
  }

  createReview(data: { productId: string; rating: number; title: string; comment: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateReview(id: string, data: { rating: number; title: string; comment: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}