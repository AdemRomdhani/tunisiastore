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

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const slugs: string[] = JSON.parse(stored);
        if (slugs.length > 0) {
          this.refreshProducts(slugs);
        }
      } catch (e) {
        this.products.set([]);
      }
    }
  }

  private refreshProducts(slugs: string[]) {
    const requests = slugs.map(slug =>
      this.http.get<{ success: boolean; product: Product }>(`${environment.apiUrl}/products/${slug}`).toPromise()
    );
    Promise.all(requests).then(results => {
      const fresh = results.filter(r => r?.success).map(r => r!.product);
      this.products.set(fresh);
      this.saveToStorage();
    }).catch(() => {});
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
