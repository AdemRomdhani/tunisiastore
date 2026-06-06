import { Component, Input, inject, ChangeDetectionStrategy, signal, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
  styles: [`
    :host { display: block; }
    .img-container {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 1rem 1rem 0 0;
    }
    .img-wrapper {
      position: relative;
      width: 100%;
      padding-top: 110%;
    }
    .img-wrapper img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    }
    .group:hover .img-wrapper img {
      transform: scale(1.08);
    }
    /* Shimmer loading skeleton */
    .shimmer {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      z-index: 1;
    }
    .shimmer.loaded { display: none; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    /* Placeholder icon */
    .placeholder-icon {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #cbd5e1;
      z-index: 0;
    }
    /* Quick add overlay */
    .quick-add-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.4) 60%, transparent);
      padding: 3rem 1rem 1rem;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    .group:hover .quick-add-overlay { transform: translateY(0); }
    @media (max-width: 767px) {
      .quick-add-overlay { display: none !important; }
    }
    /* Discount badge pulse */
    .badge-sale {
      animation: pulse-badge 2s infinite;
    }
    @keyframes pulse-badge {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.85; }
    }
  `],
  template: `
    <div class="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col border border-surface-100">
      <!-- Image Container -->
      <div class="img-container relative">
        <!-- Shimmer skeleton -->
        <div class="shimmer" [class.loaded]="imageLoaded()"></div>

        <!-- Placeholder icon (shown when no image or while loading) -->
        @if (!imageLoaded()) {
          <div class="placeholder-icon">
            <svg class="w-12 h-12 sm:w-14 sm:h-14" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        }

        <!-- Badges -->
        <div class="absolute top-2 left-2 z-10 flex flex-wrap gap-1 max-w-[65%]">
          @if (hasActiveSale) {
            <span class="badge-sale bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              -{{ discountPercentage }}%
            </span>
          }
          @for (badge of activeBadges; track badge) {
            <span [class]="getBadgeClass(badge)">
              {{ getBadgeLabel(badge) }}
            </span>
          }
        </div>

        <!-- Action Buttons - Desktop only -->
        <div class="hidden sm:flex absolute top-2 right-2 z-10 flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            (click)="toggleWishlist($event)"
            [class.text-red-500]="isInWishlist"
            [class.bg-red-50]="isInWishlist"
            [title]="isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            class="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center 
                   shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <svg class="w-4 h-4" [attr.fill]="isInWishlist ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          <button 
            (click)="toggleCompare($event)"
            [class.bg-primary-600]="isInCompare"
            [class.text-white]="isInCompare"
            [title]="isInCompare ? 'Retirer comparer' : 'Comparer'"
            class="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center 
                   shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </button>
          <button 
            (click)="openQuickView($event)"
            title="Aperçu rapide"
            class="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center 
                   shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>

        <!-- Product Image -->
        <a [routerLink]="['/product', product.slug]" class="block img-wrapper">
          <img 
            [src]="(product.media.images[0] || '') | imageUrl:'card'" 
            [alt]="product.name" 
            [loading]="imageIndex <= 4 ? 'eager' : 'lazy'"
            [attr.fetchpriority]="imageIndex <= 2 ? 'high' : null"
            (load)="onImageLoad()"
            (error)="onImageError($event)"
            decoding="async"
          >
        </a>

        <!-- Quick Add Overlay - Desktop only -->
        <div class="quick-add-overlay hidden md:block">
          <button 
            (click)="addToCart($event)"
            [disabled]="!isInStock || adding()"
            class="w-full bg-white text-surface-900 font-semibold py-2.5 rounded-xl 
                   hover:bg-primary-600 hover:text-white transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-sm"
          >
            @if (adding()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Ajout...</span>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <span class="text-[10px] sm:text-xs font-medium text-primary-600 mb-1 uppercase tracking-wider">
          {{ product.category.name }}
        </span>

        <!-- Title -->
        <a [routerLink]="['/product', product.slug]" class="block flex-1 min-h-0">
          <h3 class="text-sm font-semibold text-surface-800 line-clamp-2 hover:text-primary-600 transition-colors duration-200 mb-2 leading-snug">
            {{ product.name }}
          </h3>
        </a>

        <!-- Rating -->
        @if (product.ratings.count && product.ratings.count > 0) {
          <div class="flex items-center gap-1.5 mb-2">
            <div class="flex items-center gap-0.5">
              @for (star of [1,2,3,4,5]; track star) {
                <svg 
                  class="w-3 h-3 sm:w-3.5 sm:h-3.5" 
                  [class.text-yellow-400]="star <= product.ratings.average" 
                  [class.text-surface-200]="star > product.ratings.average" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              }
            </div>
            <span class="text-[10px] sm:text-xs text-surface-400">({{ product.ratings.count }})</span>
          </div>
        }

        <!-- Price Section -->
        <div class="mt-auto">
          <div class="flex items-baseline gap-1.5 mb-1.5">
            <span class="text-base sm:text-lg font-bold text-surface-900">
              {{ product.pricing.price | number:'1.3' }} DT
            </span>
            @if (product.pricing.originalPrice) {
              <span class="text-[10px] sm:text-xs text-surface-400 line-through">
                {{ product.pricing.originalPrice | number:'1.3' }} DT
              </span>
            }
          </div>

          <!-- Mobile Add to Cart Button -->
          <button 
            (click)="addToCart($event)"
            [disabled]="!isInStock || adding()"
            class="md:hidden w-full mt-2 bg-primary-600 text-white font-semibold py-2 rounded-lg 
                   hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs sm:text-sm"
          >
            @if (adding()) {
              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            } @else {
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            }
            <span>{{ isInStock ? 'Ajouter' : 'Indisponible' }}</span>
          </button>

          <!-- Stock Status -->
          <div class="flex items-center gap-2 text-[10px] sm:text-xs">
            @if (isInStock) {
              <span class="flex items-center gap-1 text-emerald-600 font-medium">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                En stock
              </span>
              @if (availableStock <= 5) {
                <span class="text-orange-500 font-medium">Plus que {{ availableStock }}</span>
              }
            } @else {
              <span class="flex items-center gap-1 text-surface-400">
                <span class="w-1.5 h-1.5 bg-surface-300 rounded-full"></span>
                Rupture de stock
              </span>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent implements AfterViewInit {
  @Input() product!: Product;
  @Input() imageIndex = 0;
  
  private cartService = inject(CartService);
  private compareService = inject(CompareService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private quickViewService = inject(QuickViewService);
  
  adding = signal(false);
  imageLoaded = signal(false);

  ngAfterViewInit() {
    // If image is already cached by browser, mark as loaded immediately
    const img = this.nativeElement?.querySelector('img');
    if (img?.complete && img?.naturalWidth > 0) {
      this.imageLoaded.set(true);
    }
  }

  private get nativeElement(): HTMLElement | null {
    try {
      return inject(ElementRef).nativeElement;
    } catch {
      return null;
    }
  }

  onImageLoad() {
    this.imageLoaded.set(true);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Inline SVG placeholder instead of external URL
    img.src = 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f1f5f9" width="400" height="400"/><g transform="translate(160,140)" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="10" y="20" width="60" height="50" rx="4"/><circle cx="30" cy="38" r="6"/><path d="M15 60 L30 48 L45 55 L60 40 L70 55 L70 70 L10 70Z"/></g><text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#94a3b8">Pas d'image</text></svg>`
    );
    this.imageLoaded.set(true);
  }

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
      'NEW': 'bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm',
      'BESTSELLER': 'bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm',
      'STOCK_LIMITED': 'bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm',
      'FREE_SHIPPING': 'bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm',
      'EXCLUSIVE': 'bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm'
    };
    return classes[badge] || 'bg-surface-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm';
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

  addToCart(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
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
        error: () => this.wishlistService.loadWishlist()
      });
    }
  }
}
