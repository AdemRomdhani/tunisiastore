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

export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductMedia {
  images: string[];
  videos?: string[];
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
  media: ProductMedia;
  attributes?: { [key: string]: string };
  tags: string[];
  badges: string[];
  specifications?: { [key: string]: string };
  ratings: { average: number; count: number };
  category: CategoryRef;
  brand?: string;
  isActive: boolean;
  availableForDelivery: boolean;
  onSale: boolean;
  saleEndsAt?: string;
  warranty?: {
    duration: number;
    unit: string;
  };
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private recentlyViewedApiUrl = `${environment.apiUrl}/recently-viewed`;
  private deviceId = getOrCreateDeviceId();

  constructor(private http: HttpClient) {}

  // Helper method to get device ID headers
  private getDeviceHeaders(): HttpHeaders {
    return new HttpHeaders().set('x-device-id', this.deviceId);
  }

  getProducts(params?: any): Observable<{ success: boolean; products: Product[]; pagination: any }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<{ success: boolean; products: Product[]; pagination: any }>(this.apiUrl, { params: httpParams });
  }

  getProductById(id: string): Observable<{ success: boolean; product: Product }> {
    return this.http.get<{ success: boolean; product: Product }>(`${this.apiUrl}/${id}`);
  }

  getProductBySlug(slug: string): Observable<{ success: boolean; product: Product }> {
    return this.http.get<{ success: boolean; product: Product }>(`${this.apiUrl}/${slug}`);
  }

  getRelatedProducts(productId: string): Observable<{ success: boolean; products: Product[] }> {
    return this.http.get<{ success: boolean; products: Product[] }>(`${this.apiUrl}/${productId}/related`);
  }

  getCategories(): Observable<{ success: boolean; categories: any[] }> {
    return this.http.get<{ success: boolean; categories: any[] }>(`${environment.apiUrl}/categories`);
  }

  getRecentlyViewed(): Observable<{ success: boolean; products: Product[] }> {
    return this.http.get<any>(this.recentlyViewedApiUrl, { headers: this.getDeviceHeaders() });
  }

  addRecentlyViewed(productId: string): Observable<any> {
    console.log('addRecentlyViewed called:', productId, this.deviceId);
    return this.http.post<any>(`${this.recentlyViewedApiUrl}/add`, { productId }, { headers: this.getDeviceHeaders() });
  }

  getFeaturedProducts(): Observable<{ success: boolean; products: Product[] }> {
    return this.http.get<{ success: boolean; products: Product[] }>(`${this.apiUrl}?featured=true`);
  }

  getSaleProducts(): Observable<{ success: boolean; products: Product[] }> {
    return this.http.get<{ success: boolean; products: Product[] }>(`${this.apiUrl}?onSale=true`);
  }

  getProduct(slug: string): Observable<{ success: boolean; product: Product }> {
    return this.http.get<{ success: boolean; product: Product }>(`${this.apiUrl}/${slug}`);
  }

  autocomplete(query: string): Observable<{ success: boolean; results: Product[] }> {
    return this.http.get<{ success: boolean; results: Product[] }>(`${this.apiUrl}/autocomplete?q=${encodeURIComponent(query)}&limit=5`);
  }

  // === REVIEWS - Use the proper /api/reviews endpoint ===
  
  /**
   * @deprecated Use ReviewService.getProductReviews() instead
   * This method is kept for backward compatibility
   */
  getProductReviews(slug: string): Observable<{
    success: boolean;
    reviews: Array<{
      userId: { name: string };
      rating: number;
      title: string;
      comment: string;
      verified: boolean;
      helpful: number;
      createdAt: string;
    }>;
    ratings: { average: number; count: number };
  }> {
    // Route to the correct reviews endpoint
    return this.http.get<any>(`${environment.apiUrl}/reviews/product/${slug}`);
  }

  /**
   * @deprecated Use ReviewService.createReview() instead  
   * This method is kept for backward compatibility but routes to /api/reviews
   */
  addReview(slug: string, data: { rating: number; title?: string; comment?: string; productId?: string }, images?: File[]): Observable<any> {
    // Build the correct review data
    const reviewData = {
      ...data,
      productId: data.productId || slug // fallback to slug if no productId provided
    };

    if (images && images.length > 0) {
      const formData = new FormData();
      formData.append('rating', reviewData.rating.toString());
      if (reviewData.title) formData.append('title', reviewData.title);
      if (reviewData.comment) formData.append('comment', reviewData.comment);
      if (reviewData.productId) formData.append('productId', reviewData.productId);
      images.forEach(file => formData.append('images', file));
      return this.http.post<any>(`${this.apiUrl}/${slug}/reviews`, formData);
    }

    return this.http.post<any>(`${this.apiUrl}/${slug}/reviews`, reviewData);
  }
}
