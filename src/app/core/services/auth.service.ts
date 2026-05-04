import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from './cart.service';
import { WishlistService } from './wishlist.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isVerified?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TAB_HIDDEN_KEY = 'tab_hidden_at';
  private readonly INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
  
  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isSupervisor = computed(() => this.currentUser()?.role === 'supervisor');
  isVerified = computed(() => this.currentUser()?.isVerified ?? true);

  private wishlistService = inject(WishlistService);

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cartService: CartService
  ) {
    this.loadUser();
    this.setupBeforeUnloadListener();
  }

  private setupBeforeUnloadListener() {
    window.addEventListener('beforeunload', () => {
      if (this.currentUser()) {
        localStorage.setItem(this.TAB_HIDDEN_KEY, Date.now().toString());
      }
    });
  }

  private loadUser() {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token) {
      this.currentUser.set(null);
      return;
    }

    const hiddenAt = parseInt(localStorage.getItem(this.TAB_HIDDEN_KEY) || '0', 10);
    if (hiddenAt && Date.now() - hiddenAt > this.INACTIVITY_LIMIT) {
      this.clearAuth();
      return;
    }

    localStorage.removeItem(this.TAB_HIDDEN_KEY);
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    // Verify with server
    this.http.get<{ user: User }>(`${this.apiUrl}/me`).subscribe({
      next: (res) => {
        this.currentUser.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.wishlistService.loadWishlist();
      },
      error: (err) => {
        if (err.status === 401) {
          this.clearAuth();
        }
      }
    });
  }

  register(data: any) {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/register`, data);
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string; user: User; warning?: string }>(`${this.apiUrl}/login`, credentials);
  }

  setAuth(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem(this.TAB_HIDDEN_KEY);
    this.currentUser.set(user);
    this.wishlistService.loadWishlist();
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(this.TAB_HIDDEN_KEY);
    localStorage.removeItem('deviceId');
    this.currentUser.set(null);
    this.wishlistService.wishlist.set([]);
  }

  logout() {
    this.cartService.clearCart().subscribe({
      complete: () => {
        this.clearAuth();
        this.router.navigate(['/']);
      }
    });
  }
}