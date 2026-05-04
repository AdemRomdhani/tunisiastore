import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private apiUrl = `${environment.apiUrl}/wishlist`;
  wishlist = signal<any[]>([]);

  constructor(private http: HttpClient) {}

  getWishlist(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  addToWishlist(productId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, { productId });
  }

  removeFromWishlist(productId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${productId}`);
  }

  clearWishlist(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlist().some(p => p._id === productId);
  }

  loadWishlist(): void {
    this.getWishlist().subscribe({
      next: (res) => this.wishlist.set(res.wishlist?.products || []),
      error: () => this.wishlist.set([])
    });
  }
}