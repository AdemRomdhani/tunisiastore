import { Component, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-quick-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ImageUrlPipe],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="close()"></div>
      
      <div class="relative bg-surface-50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        <button (click)="close()" class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-surface-100 transition shadow-lg">
          <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        @if (product; as p) {
          <div class="grid md:grid-cols-2">
            <div class="bg-gradient-to-b from-surface-100 to-surface-50 p-8 flex items-center justify-center">
              <div class="relative">
                <img [src]="p.media?.images?.[0] | imageUrl" [alt]="p.name" class="max-w-full max-h-80 object-contain">
                @if (p.pricing?.originalPrice) {
                  <span class="absolute -top-2 -left-2 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                    -{{ discountPercentage }}%
                  </span>
                }
              </div>
            </div>

            <div class="p-6 overflow-y-auto max-h-[90vh]">
              @if (p.category) {
                <span class="text-sm font-medium text-primary-600 uppercase tracking-wider">{{ p.category.name }}</span>
              }

              <h2 class="text-2xl font-bold text-surface-900 mt-2 mb-4">{{ p.name }}</h2>

              @if (p.ratings?.count) {
              <div class="flex items-center gap-2 mb-4">
                <div class="flex items-center gap-0.5">
                  @for (star of [1,2,3,4,5]; track star) {
                    <svg class="w-4 h-4" [class.text-yellow-400]="star <= (p.ratings?.average || 0)" [class.text-surface-200]="star > (p.ratings?.average || 0)" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  }
                </div>
                <span class="text-sm text-surface-500">({{ p.ratings?.count }} avis)</span>
              </div>
              }

              <div class="flex items-baseline gap-3 mb-5">
                <span class="text-3xl font-bold text-surface-900">{{ p.pricing?.price | number:'1.3' }} DT</span>
                @if (p.pricing?.originalPrice) {
                  <span class="text-lg text-surface-400 line-through">{{ p.pricing.originalPrice | number:'1.3' }} DT</span>
                }
              </div>

              <div class="flex items-center gap-3 mb-6">
                @if (isInStock) {
                  <span class="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse-slow"></span>
                    En stock
                  </span>
                  @if (availableStock <= 5) {
                    <span class="text-sm text-orange-600">Plus que {{ availableStock }}</span>
                  }
                } @else {
                  <span class="flex items-center gap-2 text-red-500 font-medium text-sm">
                    <span class="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    Rupture de stock
                  </span>
                }
              </div>

              <p class="text-surface-600 text-sm mb-6 line-clamp-4 leading-relaxed">
                {{ p.shortDescription || p.description || 'Aucune description disponible.' }}
              </p>

              <div class="flex gap-3">
                <button 
                  (click)="addToCart()"
                  [disabled]="!isInStock || adding()"
                  class="flex-1 bg-primary-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  @if (adding()) {
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  }
                  Ajouter au panier
                </button>
                <a [routerLink]="['/product', p.slug]" (click)="close()" class="px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-primary-600 hover:text-primary-600 transition font-medium">
                  Détails
                </a>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .line-clamp-4 {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class QuickViewComponent {
  @Input() product: Product | null = null;
  @Output() closed = new EventEmitter<void>();

  private cartService = inject(CartService);
  private router = inject(Router);

  adding = signal(false);

  get isInStock(): boolean {
    if (!this.product) return false;
    const quantity = this.product.inventory?.quantity || 0;
    const reserved = this.product.inventory?.reserved || 0;
    return (quantity - reserved) > 0;
  }

  get availableStock(): number {
    if (!this.product) return 0;
    const quantity = this.product.inventory?.quantity || 0;
    const reserved = this.product.inventory?.reserved || 0;
    return Math.max(0, quantity - reserved);
  }

  get discountPercentage(): number {
    if (!this.product?.pricing?.originalPrice) return 0;
    return Math.round(
      ((this.product.pricing.originalPrice - this.product.pricing.price) / this.product.pricing.originalPrice) * 100
    );
  }

  close() {
    this.closed.emit();
  }

  addToCart() {
    if (!this.isInStock || this.adding() || !this.product) return;
    this.adding.set(true);
    this.cartService.addToCart(this.product._id, 1).subscribe({
      next: () => {
        this.cartService.refreshCart();
        this.adding.set(false);
        this.close();
      },
      error: () => {
        this.adding.set(false);
      }
    });
  }
}