import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe, TranslatePipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">{{ 'wishlist.title' | t }}</h1>
      
      @if (loading()) {
        <div class="text-center py-12">{{ 'common.loading' | t }}</div>
      } @else if (products().length === 0) {
        <div class="text-center py-12">
          <p class="text-gray-500 mb-4">{{ 'wishlist.empty' | t }}</p>
          <a routerLink="/products" class="text-primary-600 hover:underline">{{ 'wishlist.continueShopping' | t }}</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of products(); track product._id) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <a [routerLink]="['/product', product.slug]" class="block">
                <img [src]="product.media?.images?.[0] | imageUrl" [alt]="product.name" 
                     class="w-full h-48 object-contain bg-gray-50" width="300" height="200">
              </a>
              <div class="p-4">
                <a [routerLink]="['/product', product.slug]" class="font-medium text-gray-800 hover:text-primary-600 line-clamp-2">
                  {{ product.name }}
                </a>
                <div class="mt-2 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-lg">{{ product.pricing?.price | number:'1.3' }} DT</span>
                    @if (product.pricing?.originalPrice > product.pricing?.price) {
                      <span class="text-sm text-gray-400 line-through ml-2">{{ product.pricing?.originalPrice | number:'1.3' }}</span>
                    }
                  </div>
                </div>
                <div class="mt-3 flex gap-2">
                  <button (click)="addToCart(product)" class="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition text-sm">
                    {{ 'product.addToCart' | t }}
                  </button>
                  <button (click)="removeFromWishlist(product._id)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="{{ 'common.delete' | t }}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class WishlistComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toast = inject(ToastService);

  products = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    this.loading.set(true);
    this.wishlistService.getWishlist().subscribe({
      next: (res) => {
        this.products.set(res.wishlist?.products || []);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      }
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product, 1).subscribe({
      next: () => this.toast.success('Panier', 'Produit ajouté au panier'),
      error: () => this.toast.error('Erreur', 'Impossible d\'ajouter au panier')
    });
  }

  removeFromWishlist(productId: string) {
    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: () => {
        this.products.set(this.products().filter(p => p._id !== productId));
        this.toast.success('Succès', 'Produit supprimé de la liste');
      },
      error: () => this.toast.error('Erreur', 'Impossible de supprimer')
    });
  }
}