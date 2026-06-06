import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from './product.service';
import { environment } from '../../../environments/environment';

const MAX_COMPARE_ITEMS = 4;

@Injectable({ providedIn: 'root' })
export class CompareService {
  private storageKey = 'compare_products';
  private http = inject(HttpClient);

  products = signal<Product[]>([]);
  loading = signal(true);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      this.loading.set(false);
      return;
    }

    try {
      const data = JSON.parse(stored);

      if (!Array.isArray(data) || data.length === 0) {
        this.loading.set(false);
        return;
      }

      // Migration: old format stored product objects, new format stores slugs
      const slugs: string[] = typeof data[0] === 'string'
        ? data
        : data.map((p: any) => p.slug).filter(Boolean);

      if (slugs.length === 0) {
        localStorage.removeItem(this.storageKey);
        this.loading.set(false);
        return;
      }

      // Always clear old data and show loading until fresh data arrives
      this.products.set([]);

      const requests = slugs.map(slug =>
        this.http.get<{ success: boolean; product: Product }>(`${environment.apiUrl}/products/${slug}`).toPromise()
      );

      Promise.all(requests).then(results => {
        const fresh = results.filter(r => r?.success).map(r => r!.product);
        this.products.set(fresh);
        this.saveToStorage();
        this.loading.set(false);
      }).catch(() => {
        this.loading.set(false);
      });
    } catch (e) {
      this.products.set([]);
      localStorage.removeItem(this.storageKey);
      this.loading.set(false);
    }
  }

  private saveToStorage() {
    const slugs = this.products().map(p => p.slug);
    localStorage.setItem(this.storageKey, JSON.stringify(slugs));
  }

  addToCompare(product: Product): boolean {
    if (this.products().length >= MAX_COMPARE_ITEMS) {
      return false;
    }
    if (this.products().some(p => p._id === product._id)) {
      return false;
    }
    this.products.update(list => [...list, product]);
    this.saveToStorage();
    return true;
  }

  removeFromCompare(productId: string) {
    this.products.update(list => list.filter(p => p._id !== productId));
    this.saveToStorage();
  }

  clearCompare() {
    this.products.set([]);
    localStorage.removeItem(this.storageKey);
  }

  isInCompare(productId: string): boolean {
    return this.products().some(p => p._id === productId);
  }

  count(): number {
    return this.products().length;
  }
}
