import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface BundleProduct {
  product: {
    _id: string;
    name: string;
    slug: string;
    pricing: { price: number; originalPrice?: number };
    media: { images: string[] };
    badges: string[];
    isActive?: boolean;
    inventory?: { quantity: number; reserved: number };
  };
  quantity: number;
}

interface Bundle {
  _id: string;
  name: string;
  slug: string;
  description: string;
  pricing: { price: number; originalPrice: number; discountPercentage: number };
  products: BundleProduct[];
  isActive: boolean;
}

@Component({
  selector: 'app-bundles',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe, SkeletonComponent, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ 'bundles.title' | t }}</h1>
      <p class="text-gray-500 mb-8">{{ 'bundles.saveMore' | t }}</p>
      
      @if (loading()) {
        <div class="space-y-6">
          @for (item of [1,2,3]; track item) {
            <div class="bg-white rounded-2xl shadow-sm h-64 animate-pulse"></div>
          }
        </div>
      } @else if (bundles().length === 0) {
        <div class="text-center py-16 bg-white rounded-xl shadow-sm">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0l-4-4m4 4l-4 4"/>
          </svg>
          <p class="text-gray-500 text-lg mb-4">Aucun pack disponible</p>
          <a routerLink="/products" class="btn-primary inline-block">Parcourir les produits</a>
        </div>
      } @else {
        <div class="space-y-6">
          @for (bundle of bundles(); track bundle._id) {
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
              <!-- Header -->
              <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-2xl font-bold text-white mb-1">{{ bundle.name }}</h2>
                    @if (bundle.description) {
                      <p class="text-primary-100 text-sm">{{ bundle.description }}</p>
                    }
                  </div>
                  @if (bundle.pricing.discountPercentage > 0) {
                    <div class="bg-white text-primary-600 px-4 py-2 rounded-xl text-center">
                      <span class="text-2xl font-bold">-{{ bundle.pricing.discountPercentage }}%</span>
                      <span class="text-xs block">ÉCONOMIE</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Products -->
              <div class="p-6">
                <div class="flex flex-wrap gap-4">
                  @for (item of bundle.products; track item.product._id) {
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div class="relative">
                        <img [src]="item.product.media?.images?.[0] | imageUrl" [alt]="item.product.name" 
                             class="w-14 h-14 object-contain bg-white rounded-lg border">
                        @if (item.quantity > 1) {
                          <span class="absolute -top-1 -right-1 bg-primary-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                            ×{{ item.quantity }}
                          </span>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 text-sm truncate">{{ item.product.name }}</p>
                        <p class="text-xs text-gray-500">{{ item.product.pricing?.price | number:'1.3' }} DT</p>
                      </div>
                    </div>
                  }
                  
                  <!-- Total -->
                  <div class="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                    <div class="w-14 h-14 flex items-center justify-center">
                      <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm text-indigo-600 font-medium">Prix total</p>
                      <p class="text-lg font-bold text-indigo-800">{{ totalPrice(bundle) | number:'1.3' }} DT</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-6 pb-6 flex items-center justify-between border-t pt-4">
                <div>
                  <div class="flex items-baseline gap-3">
                    <span class="text-3xl font-bold text-primary-600">
                      {{ bundle.pricing.price | number:'1.3-3' }} DT
                    </span>
                    @if (bundle.pricing.originalPrice > bundle.pricing.price) {
                      <span class="text-lg text-gray-400 line-through">
                        {{ bundle.pricing.originalPrice | number:'1.3-3' }} DT
                      </span>
                    }
                  </div>
                  @if (bundle.pricing.discountPercentage > 0) {
                    <p class="text-sm text-green-600 font-medium mt-1">
                      Vous économisez {{ bundle.pricing.originalPrice - bundle.pricing.price | number:'1.3-3' }} DT
                    </p>
                  }
                </div>
<button
              (click)="orderBundle(bundle)"
              [disabled]="addingToCart() === bundle._id"
              class="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition shadow-lg shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              @if (addingToCart() === bundle._id) {
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ajout...
              } @else {
                Commander ce pack
              }
            </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class BundlesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cartService = inject(CartService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/bundles`;

  bundles = signal<Bundle[]>([]);
  loading = signal(true);
  addingToCart = signal<string | null>(null);

  ngOnInit() {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.bundles.set(res.bundles || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  totalPrice(bundle: Bundle): number {
    if (!bundle.products) return 0;
    return bundle.products.reduce((sum, item) => {
      return sum + ((item.product?.pricing?.price || 0) * item.quantity);
    }, 0);
  }

  async orderBundle(bundle: Bundle) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/bundles' } });
      return;
    }

    if (this.addingToCart()) return;

    this.addingToCart.set(bundle._id);

    const products = bundle.products.filter(item => item.product && item.product._id);

    if (products.length === 0) {
      this.toast.error('Erreur', 'Aucun produit disponible dans ce pack');
      this.addingToCart.set(null);
      return;
    }

    const unavailableProduct = products.find(item => {
      if (item.product.isActive === false) return true;
      const inv = item.product.inventory || { quantity: 0, reserved: 0 };
      const available = (inv.quantity || 0) - (inv.reserved || 0);
      return available < item.quantity;
    });

    if (unavailableProduct) {
      this.toast.error('Erreur', `Le produit "${unavailableProduct.product.name}" n'est plus disponible ou en stock insuffisant.`);
      this.addingToCart.set(null);
      return;
    }

    try {
      for (const item of products) {
        await this.cartService.addToCart(item.product._id, item.quantity).toPromise();
      }
      this.toast.success('Succès', 'Pack ajouté au panier');
      this.router.navigate(['/cart']);
    } catch (error) {
      this.toast.error('Erreur', 'Erreur lors de l\'ajout au panier');
    } finally {
      this.addingToCart.set(null);
    }
  }
}