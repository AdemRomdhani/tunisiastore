import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../../core/services/product.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-recently-viewed',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, SkeletonComponent, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ 'recentlyViewed.title' | t }}</h1>
      
      @if (loading()) {
        <app-skeleton type="product-list" [count]="8" gridClass="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"/>
      } @else if (products().length === 0) {
        <div class="text-center py-16 bg-white rounded-xl">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-500 text-lg mb-2">{{ 'recentlyViewed.empty' | t }}</p>
          <p class="text-gray-400 text-sm mb-4">{{ 'recentlyViewed.emptyDesc' | t }}</p>
          <a routerLink="/products" class="btn-primary inline-block">{{ 'nav.products' | t }}</a>
        </div>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (product of products(); track product._id; let i = $index) {
            <app-product-card [product]="product" [imageIndex]="i"/>
          }
        </div>
      }
    </div>
  `
})
export class RecentlyViewedComponent implements OnInit {
  private productService = inject(ProductService);
  
  products = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.productService.getRecentlyViewed().subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}