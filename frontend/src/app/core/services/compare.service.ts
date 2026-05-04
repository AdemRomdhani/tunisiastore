import { Injectable, signal } from '@angular/core';
import { Product } from './product.service';

const MAX_COMPARE_ITEMS = 4;

@Injectable({ providedIn: 'root' })
export class CompareService {
  private storageKey = 'compare_products';
  
  products = signal<Product[]>([]);
  
  constructor() {
    this.loadFromStorage();
  }
  
  private loadFromStorage() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.products.set(JSON.parse(stored));
      } catch (e) {
        this.products.set([]);
      }
    }
  }
  
  private saveToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.products()));
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