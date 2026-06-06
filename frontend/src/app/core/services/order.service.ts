import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      slug: string;
      pricing: { price: number };
      media: { images: string[] };
    };
    quantity: number;
    price: number;
  }>;
  pricing: {
    subtotal: number;
    shipping: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
  };
  shipping: {
    address?: {
      fullName: string;
      phone: string;
      governorate: string;
      city: string;
      streetAddress: string;
    };
    estimatedDelivery: string;
    trackingNumber?: string;
  };
  createdAt: string;
}

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  private deviceId = getOrCreateDeviceId();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'x-device-id': this.deviceId });
  }

  createOrder(data: any): Observable<{ success: boolean; order: any }> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  getMyOrders(): Observable<{ success: boolean; orders: Order[] }> {
    return this.http.get<any>(`${this.apiUrl}/my-orders`, { headers: this.getHeaders() });
  }

  getOrder(id: string): Observable<{ success: boolean; order: any }> {
    return this.http.get<any>(`${this.apiUrl}/my-orders/${id}`, { headers: this.getHeaders() });
  }

  trackOrder(orderNumber: string, email?: string, phone?: string): Observable<{ success: boolean; order: any; message?: string }> {
    return this.http.post<any>(`${this.apiUrl}/track`, { orderNumber, email, phone });
  }

  cancelOrder(orderId: string, reason?: string, email?: string): Observable<{ success: boolean; message?: string; order?: any }> {
    return this.http.post<any>(`${this.apiUrl}/cancel/${orderId}`, { reason, email });
  }

  getCarriers(): Observable<{ success: boolean; carriers: any[] }> {
    return this.http.get<any>(`${environment.apiUrl}/shipping/carriers`);
  }

  getShippingCost(governorate: string, carrier?: string): Observable<{ success: boolean; cost: number }> {
    const url = carrier 
      ? `${environment.apiUrl}/shipping/cost?governorate=${governorate}&carrier=${carrier}`
      : `${environment.apiUrl}/shipping/cost?governorate=${governorate}`;
    return this.http.get<any>(url);
  }

  validateCoupon(code: string, subtotal: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/coupons/validate`, { code, subtotal });
  }

  reorder(orderId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<any>(`${this.apiUrl}/reorder/${orderId}`, {}, { headers: this.getHeaders() });
  }
}