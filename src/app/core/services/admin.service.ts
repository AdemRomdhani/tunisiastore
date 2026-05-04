import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  baseUrl = environment.apiUrl.replace('/api', '');

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getProducts(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`);
  }

  createProduct(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: string, data: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, data);
  }

  duplicateProduct(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${id}/duplicate`, {});
  }

  addStock(id: string, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${id}/add-stock`, { quantity });
  }

  bulkUpdateProducts(data: { productIds: string[]; action: string; data?: any }): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/bulk`, data);
  }

  getOrders(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, { params });
  }

  updateOrderStatus(id: string, status: string, note?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/status`, { status, note });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`);
  }

  bulkUpdateOrders(orderIds: string[], status: string, note?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/bulk-status`, { orderIds, status, note });
  }

  addOrderNote(orderId: string, note: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/notes`, { note });
  }

  getOrderNotes(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}/notes`);
  }

  getOrderInvoice(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}/invoice`);
  }

  getLowStockProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/low-stock`);
  }

  getPendingOrdersCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/count/pending`);
  }

  getRecentOrders(limit: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, { params: { limit: limit.toString(), status: 'PENDING' } });
  }

  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics`);
  }

  getCharts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/charts`);
  }

  getUsers(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { params });
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  getUserOrders(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/orders`);
  }

  getReturns(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/returns`, { params });
  }

  updateReturn(id: string, data: { status: string; adminNotes?: string; refundMethod?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/returns/${id}`, data);
  }

  getContacts(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/contacts`, { params });
  }

  markContactAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/contacts/${id}/read`, {});
  }

  markAllContactsAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}/contacts/read-all`, {});
  }

  deleteContact(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/contacts/${id}`);
  }

  getNewUsersCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/new-count`);
  }

  getCoupons(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/coupons`, { params });
  }

  createCoupon(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/coupons`, data);
  }

  updateCoupon(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/coupons/${id}`, data);
  }

  deleteCoupon(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/coupons/${id}`);
  }

  getNewsletterSubscribers(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/newsletter`, { params });
  }

  getCmsPages(params?: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/cms/pages`, { params });
  }

  createCmsPage(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/cms`, data);
  }

  updateCmsPage(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/cms/${id}`, data);
  }

  deleteCmsPage(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/cms/${id}`);
  }

  getFaqs(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/cms/faqs`);
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  exportUsers(format: 'csv' | 'json' = 'csv'): void {
    const token = this.getToken();
    if (!token) {
      console.warn('No auth token found');
      return;
    }
    fetch(`${this.apiUrl}/export/users?format=${format}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      const contentDisposition = res.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename=(.+)/)?.[1] || `users-${Date.now()}.csv`;
      return res.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => console.error('Export failed:', err));
  }

  exportOrders(format: 'csv' | 'json' = 'csv', params?: any): void {
    const token = this.getToken();
    if (!token) {
      console.warn('No auth token found');
      return;
    }
    const queryParams = new URLSearchParams({ format, ...params }).toString();
    fetch(`${this.apiUrl}/export/orders?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      const contentDisposition = res.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename=(.+)/)?.[1] || `orders-${Date.now()}.csv`;
      return res.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => console.error('Export failed:', err));
  }
}