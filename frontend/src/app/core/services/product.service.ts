import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('deviceId', deviceId);
    console.log('Created new deviceId:', deviceId);
  }
  console.log('Using deviceId:', deviceId);
  return deviceId;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  pricing: {
    price: number;
    originalPrice?: number;
    currency: string;
  };
  inventory: {
    quantity: number;
    reserved: number;
    sku?: string;
  };
  media: {
    images: string[];
    videos?: string[];
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  badges: string[];
  ratings: {
    average: number;
    count: number;
  };
  specifications: Array<{
    group: string;
    items: Array<{ key: string; value: string }>;
    expanded?: boolean;
  }>;
  warranty?: {
    duration: number;
    type: string;
  };
  onSale?: boolean;
  saleEndsAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  search?: string;
  featured?: boolean;
  onSale?: boolean;
  inStock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private recentlyViewedApiUrl = `${environment.apiUrl}/recently-viewed`;
  private deviceId = getOrCreateDeviceId();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'x-device-id': this.deviceId });
  }

  getProducts(filters: ProductFilters = {}): Observable<{
    success: boolean;
    products: Product[];
    pagination: any;
  }> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(this.apiUrl, { params });
  }

  getProduct(slug: string): Observable<{ success: boolean; product: Product }> {
    return this.http.get<any>(`${this.apiUrl}/${slug}`);
  }

  getProductReviews(slug: string): Observable<{
    success: boolean;
    reviews: Array<{
      rating: number;
      title: string;
      comment: string;
      verified: boolean;
      helpful: number;
      createdAt: string;
    }>;
    ratings: { average: number; count: number };
  }> {
    return this.http.get<any>(`${this.apiUrl}/${slug}/reviews`);
  }

  addReview(slug: string, data: { rating: number; title?: string; comment?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${slug}/reviews`, data);
  }

  getRecentlyViewed(): Observable<{ success: boolean; products: Product[] }> {
    return this.http.get<any>(this.recentlyViewedApiUrl, { headers: this.getHeaders() });
  }

  addRecentlyViewed(productId: string): Observable<any> {
    console.log('addRecentlyViewed called:', productId, this.deviceId);
    return this.http.post<any>(`${this.recentlyViewedApiUrl}/add`, { productId }, { headers: this.getHeaders() });
  }
}