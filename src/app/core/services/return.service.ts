import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReturnRequest {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
  };
  type: 'RETURN' | 'REFUND';
  reason: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  refundAmount?: number;
  timeline: Array<{
    status: string;
    note: string;
    timestamp: string;
  }>;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReturnService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/returns`;

  returns = signal<ReturnRequest[]>([]);

  getMyReturns(): Observable<{ success: boolean; returns: ReturnRequest[] }> {
    return this.http.get<{ success: boolean; returns: ReturnRequest[] }>(`${this.apiUrl}/my-returns`).pipe(
      tap(res => this.returns.set(res.returns))
    );
  }

  createReturn(data: {
    orderId: string;
    items: Array<{ productId: string; quantity: number; reason: string }>;
    type: 'RETURN' | 'REFUND';
    reason: string;
    description: string;
    email?: string;
  }): Observable<{ success: boolean; message: string; returnRequest: ReturnRequest }> {
    return this.http.post<any>(this.apiUrl, data);
  }
}