import { Component, Input, inject, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CompareService } from '../../../core/services/compare.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { QuickViewService } from '../../../core/services/quick-view.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ImageUrlPipe, TranslatePipe],
  template: `
    <div class="group bg-surface-50 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-350 ease-smooth border border-surface-100 overflow-hidden h-full flex flex-col animate-fade-in">
      <!-- Image Container -->
      <div class="relative overflow-hidden bg-gradient-to-b from-surface-100 to-surface-50 aspect-square">
        <!-- Badges -->
        <div class="absolute top-2 left-2 z-10 flex flex-wrap gap-1 max-w-[60%]">
          @if (hasActiveSale) {
            <span class="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
              -{{ discountPercentage }}%
            </span>
          }
          @for (badge of activeBadges; track badge) {
            <span [class]="getBadgeClass(badge)">
              {{ getBadgeLabel(badge) }}
            </span>
          }
        </div>

        <!-- Action Buttons - Always visible on mobile -->
        <div class="absolute top-2 right-2 z-10 flex flex-col gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-250">
          <!-- Wishlist -->
          <button 
            (click)="toggleWishlist($event)"
            [class.text-red-500]="isInWishlist"
            [title]="isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            class="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center 
                   shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <svg class="w-5 h-5" [attr.fill]="isInWishlist ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <!-- Compare -->
          <button 
            (click)="toggleCompare($event)"
            [class.bg-primary-600]="isInCompare"
            [class.text-white]="isInCompare"
            [title]="isInCompare ? 'Retirer comparer' : 'Comparer'"
            class="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center 
                   shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </button>
          <!-- Quick View -->
          <button 
            (click)="openQuickView($event)"
            title="Aperçu rapide"
            class="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center 
                   shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>

        <!-- Product Image -->
        <a [routerLink]="['/product', product.slug]" class="block h-full p-5">
          <img 
            [src]="(product.media?.images?.[0] || '') | imageUrl" 
            [alt]="product.name" 
            loading="lazy"
            class="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500 ease-smooth"
            onerror="this.src='https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image'"
          >
        </a>

        <!-- Quick Add Overlay - Desktop only -->
        <div class="hidden md:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 pt-16 
                    translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-smooth">
          <button 
            (click)="addToCart()"
            [disabled]="!isInStock || adding()"
            class="w-full bg-white text-surface-900 font-semibold py-3 rounded-xl 
                   hover:bg-primary-600 hover:text-white transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            @if (adding()) {
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Ajout...</span>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span>{{ isInStock ? 'Ajouter au panier' : 'Rupture de stock' }}</span>
            }
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-3 sm:p-4 flex-1 flex flex-col">
        <!-- Category -->
        @if (product.category) {
          <span class="text-[10px] sm:text-xs font-medium text-primary-600 mb-1 uppercase tracking-wider">
            {{ product.category.name }}
          </span>
        }

        <!-- Title -->
        <a [routerLink]="['/product', product.slug]" class="block flex-1">
          <h3 class="text-sm font-semibold text-surface-800 line-clamp-2 hover:text-primary-600 transition-colors duration-200 mb-2 sm:mb-3">
            {{ product.name }}
          </h3>
        </a>

        <!-- Rating -->
        @if (product.ratings?.count && product.ratings.count > 0) {
          <div class="flex items-center gap-2 mb-2 sm:mb-3">
            <div class="flex items-center gap-0.5">
              @for (star of [1,2,3,4,5]; track star) {
                <svg 
                  class="w-3.5 h-3.5" 
                  [class.text-yellow-400]="star <= product.ratings.average" 
                  [class.text-surface-200]="star > product.ratings.average" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              }
            </div>
            <span class="text-xs text-surface-500">({{ product.ratings.count }})</span>
          </div>
        }

        <!-- Price Section -->
        <div class="mt-auto">
          <div class="flex items-baseline gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <span class="text-lg sm:text-xl font-bold text-surface-900">
              {{ product.pricing.price | number:'1.3' }} DT
            </span>
            @if (product.pricing.originalPrice) {
              <span class="text-xs sm:text-sm text-surface-400 line-through">
                {{ product.pricing.originalPrice | number:'1.3' }} DT
              </span>
            }
          </div>

          <!-- Mobile Add to Cart Button -->
          <button 
            (click)="addToCart()"
            [disabled]="!isInStock || adding()"
            class="md:hidden w-full mt-3 bg-primary-600 text-white font-semibold py-2.5 rounded-lg 
                   hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            @if (adding()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            }
            <span>{{ isInStock ? 'Ajouter' : 'Indisponible' }}</span>
          </button>

          <!-- Stock Status -->
          <div class="flex items-center gap-2 text-xs sm:text-sm">
            @if (isInStock) {
              <span class="flex items-center gap-1 text-emerald-600">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                En stock
              </span>
              @if (availableStock <= 5) {
                <span class="text-xs text-orange-600">• Plus que {{ availableStock }}</span>
              }
            } @else {
              <span class="flex items-center gap-1.5 text-sm text-surface-500">
                <span class="w-2 h-2 bg-surface-300 rounded-full"></span>
                Rupture de stock
              </span>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input() product!: Product;
  
  private cartService = inject(CartService);
  private compareService = inject(CompareService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private quickViewService = inject(QuickViewService);
  
  adding = signal(false);

  openQuickView(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.quickViewService.open(this.product);
  }

  

  get isInCompare(): boolean {
    return this.compareService.isInCompare(this.product._id);
  }

  get isInStock(): boolean {
    const quantity = this.product.inventory?.quantity || 0;
    const reserved = this.product.inventory?.reserved || 0;
    return (quantity - reserved) > 0;
  }

  get availableStock(): number {
    const quantity = this.product.inventory?.quantity || 0;
    const reserved = this.product.inventory?.reserved || 0;
    return Math.max(0, quantity - reserved);
  }

  get isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product._id);
  }

  get discountPercentage(): number {
    if (!this.product.pricing?.originalPrice) return 0;
    return Math.round(
      ((this.product.pricing.originalPrice - this.product.pricing.price) / this.product.pricing.originalPrice) * 100
    );
  }

  get hasActiveSale(): boolean {
    if (this.product.onSale && this.product.saleEndsAt) {
      return new Date(this.product.saleEndsAt) > new Date();
    }
    if (this.product.pricing?.originalPrice && this.product.pricing?.price) {
      return this.product.pricing.originalPrice > this.product.pricing.price;
    }
    return false;
  }

  get activeBadges(): string[] {
    const badges = this.product.badges || [];
    return badges.filter(b => b !== 'PROMO');
  }

  getBadgeClass(badge: string): string {
    const classes: Record<string, string> = {
      'NEW': 'bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md',
      'BESTSELLER': 'bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md',
      'STOCK_LIMITED': 'bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md',
      'FREE_SHIPPING': 'bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md',
      'EXCLUSIVE': 'bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md'
    };
    return classes[badge] || 'bg-surface-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md';
  }

  getBadgeLabel(badge: string): string {
    const labels: Record<string, string> = {
      'NEW': 'Nouveau',
      'BESTSELLER': 'Best-seller',
      'STOCK_LIMITED': 'Stock limité',
      'FREE_SHIPPING': 'Livraison gratuite',
      'EXCLUSIVE': 'Exclusif'
    };
    return labels[badge] || badge;
  }

  addToCart() {
    if (!this.isInStock || this.adding()) return;
    this.adding.set(true);
    this.cdr.markForCheck();
    this.cartService.addToCart(this.product._id, 1).subscribe({
      next: () => {
        this.cartService.refreshCart();
        this.adding.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.adding.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  toggleCompare(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isInCompare) {
      this.compareService.removeFromCompare(this.product._id);
    } else {
      this.compareService.addToCompare(this.product);
    }
  }

  toggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    const productId = this.product._id;
    const wasInWishlist = this.isInWishlist;
    
    if (wasInWishlist) {
      this.wishlistService.removeFromWishlist(productId).subscribe({
        next: () => this.wishlistService.loadWishlist(),
        error: () => this.wishlistService.loadWishlist()
      });
    } else {
      this.wishlistService.addToWishlist(productId).subscribe({
        next: () => this.wishlistService.loadWishlist(),
        error: () => this.wishlistService.loadWishlist() // Silent fail - just reload
      });
    }
  }
}