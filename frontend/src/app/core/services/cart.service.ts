import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    pricing: { price: number };
    media: { images: string[] };
    inventory: { quantity: number; reserved: number };
    badges: string[];
  };
  quantity: number;
  selectedAttributes?: any[];
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
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private deviceId = getOrCreateDeviceId();
  
  cartItems = signal<CartItem[]>([]);
  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  subtotal = computed(() => 
    this.cartItems().reduce((sum, item) => sum + (item.product.pricing.price * item.quantity), 0)
  );
  shippingCost = computed(() => this.subtotal() >= 200 ? 0 : 7);
  ht = computed(() => this.subtotal() + this.shippingCost());
  tva = computed(() => Math.round(this.ht() * 0.19 * 100) / 100);
  timbre = computed(() => 0);
  ttc = computed(() => this.ht() + this.tva());

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'x-device-id': this.deviceId });
  }

  loadCart() {
    this.http.get<{ cart: { items: CartItem[] } }>(`${this.apiUrl}`, { headers: this.getHeaders() })
      .pipe(
        tap(res => this.cartItems.set(res.cart?.items || []))
      )
      .subscribe({
        error: () => this.cartItems.set([])
      });
  }

  addToCart(productId: string, quantity: number = 1, attributes?: any[]) {
    return this.http.post<{ cart: { items: CartItem[] } }>(`${this.apiUrl}/add`, {
      productId,
      quantity,
      attributes
    }, { headers: this.getHeaders() }).pipe(
      tap(res => this.cartItems.set(res.cart.items))
    );
  }

  updateQuantity(itemId: string, quantity: number) {
    return this.http.put<{ cart: { items: CartItem[] } }>(`${this.apiUrl}/item/${itemId}`, { quantity }, { headers: this.getHeaders() })
      .pipe(
        tap(res => this.cartItems.set(res.cart.items))
      );
  }

  removeItem(itemId: string) {
    console.log('Removing item:', itemId, 'headers:', this.getHeaders());
    return this.http.delete<{ cart: { items: CartItem[] } }>(`${this.apiUrl}/item/${itemId}`, { headers: this.getHeaders() })
      .pipe(
        tap({
          next: (res) => {
            console.log('Remove success:', res);
            this.cartItems.set(res.cart.items);
          },
          error: (err) => console.error('Remove item error:', err)
        })
      );
  }

  clearCart() {
    return this.http.delete<{ cart: { items: CartItem[] } }>(`${this.apiUrl}/clear`, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.cartItems.set([]))
      );
  }

  refreshCart() {
    this.loadCart();
  }
}