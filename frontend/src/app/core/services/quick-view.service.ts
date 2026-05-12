import { Injectable, signal } from '@angular/core';
import { Product } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class QuickViewService {
  isOpen = signal(false);
  product = signal<Product | null>(null);

  open(product: Product) {
    this.product.set(product);
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen.set(false);
    this.product.set(null);
    document.body.style.overflow = '';
  }
}