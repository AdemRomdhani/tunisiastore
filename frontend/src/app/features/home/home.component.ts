import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService, Product } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, FormsModule, TranslatePipe],
  template: `
    <div class="min-h-screen">
      <!-- Hero Section - Enhanced -->
      <section class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <!-- Animated Background -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-primary-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
        </div>
        
        <div class="container mx-auto px-3 sm:px-4 py-12 sm:py-16 lg:py-32 relative">
          <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div class="max-w-2xl">
              <span class="inline-flex items-center gap-2 bg-white/10 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6">
                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {{ 'home.newCollection' | t }}
              </span>
              <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                {{ 'home.technologyTitle' | t }}<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-200">{{ 'home.atYourFingertips' | t }}</span>
              </h1>
              <p class="text-sm sm:text-base lg:text-lg text-primary-100 mb-6 sm:mb-8 leading-relaxed">
                {{ 'home.heroDescription' | t }}
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <a routerLink="/products" class="group bg-white text-primary-600 px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl text-center text-sm sm:text-base">
                  {{ 'home.discover' | t }}
                  <svg class="inline-block ml-2 w-4 h-4 sm:w-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </a>
                <a routerLink="/products" [queryParams]="{onSale: true}" class="flex items-center justify-center gap-2 border-2 border-white/30 text-white px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-xl font-semibold hover:bg-white/10 transition text-center text-sm sm:text-base">
                  <svg class="w-4 h-4 sm:w-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {{ 'home.promotions' | t }}
                </a>
              </div>
            </div>
            
            <div class="hidden lg:block relative">
              <div class="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
                <div class="grid grid-cols-2 gap-6">
                  <div class="text-center">
                    <div class="text-4xl font-bold">10K+</div>
                    <div class="text-primary-200 text-sm">{{ 'home.satisfiedClients' | t }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-4xl font-bold">500+</div>
                    <div class="text-primary-200 text-sm">{{ 'home.products' | t }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-4xl font-bold">24h</div>
                    <div class="text-primary-200 text-sm">{{ 'home.delivery' | t }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-4xl font-bold">4.9</div>
                    <div class="text-primary-200 text-sm">{{ 'home.averageRating' | t }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features - Enhanced -->
      <section class="py-10 sm:py-16 bg-white border-b hidden sm:block">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            @for (feature of features; track feature.title) {
              <div class="group flex items-center sm:block gap-2 sm:gap-4 p-3 sm:p-6 rounded-xl sm:rounded-2xl hover:bg-primary-50 transition-all duration-300">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-primary-100 rounded-lg sm:rounded-xl flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform flex-shrink-0">
                  <span class="text-lg sm:text-2xl">{{ feature.icon }}</span>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-gray-900 text-xs sm:text-base truncate sm:truncate-none">{{ feature.title }}</h3>
                  <p class="text-xs text-gray-500 hidden sm:block">{{ feature.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      @if (featuredProducts().length > 0) {
      <!-- Featured Products -->
      <section class="py-10 sm:py-16">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900">{{ 'home.featuredProducts' | t }}</h2>
              <p class="text-gray-500 mt-0.5 text-xs sm:text-sm hidden sm:block">{{ 'home.bestSelections' | t }}</p>
            </div>
            <a routerLink="/products" class="text-primary-600 font-medium hover:underline flex items-center gap-1 text-sm">
              {{ 'common.viewAll' | t }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
            @for (product of featuredProducts(); track product._id; let i = $index) {
              <app-product-card [product]="product" [imageIndex]="i"/>
            }
          </div>
        </div>
      </section>
      }

      <!-- Promo Banner -->
      

      <!-- Flash Deals Section - Premium Redesign -->
      @if (hasFlashDeals()) {
        <section class="py-12 sm:py-20 bg-surface-950 relative overflow-hidden">
          <!-- Ambient Background Effects -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-[-20%] right-[-10%] w-[50%] h-[70%] bg-primary-600/20 blur-[120px] rounded-full"></div>
            <div class="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] bg-orange-600/10 blur-[100px] rounded-full"></div>
          </div>

          <div class="container mx-auto px-4 relative z-10">
            <div class="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div class="text-center md:text-left">
                <div class="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 px-3 py-1 rounded-full mb-4">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  <span class="text-primary-400 text-xs font-bold uppercase tracking-widest">{{ 'home.limitedOffers' | t }}</span>
                </div>
                <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">{{ 'home.flash' | t }} <span class="text-primary-500">{{ 'home.offers' | t }}</span></h2>
                <p class="text-surface-400 max-w-md">{{ 'home.flashDealsDesc' | t }}</p>
              </div>

              @if (globalHasTimer && getSoonestExpiringDeal(); as timer) {
                <div class="flex flex-col items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl">
                  <span class="text-surface-400 text-xs font-medium uppercase tracking-wider">{{ 'home.promoEndsIn' | t }}</span>
                  <div class="flex items-center gap-3">
                    @if (timer.days > 0) {
                      <div class="flex flex-col items-center">
                        <div class="bg-primary-600 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg shadow-primary-600/20 mb-1">
                          {{ timer.days }}
                        </div>
                        <span class="text-[10px] text-surface-500 uppercase font-bold">{{ 'home.days' | t }}</span>
                      </div>
                      <span class="text-2xl font-bold text-white mb-6">:</span>
                    }
                    <div class="flex flex-col items-center">
                      <div class="bg-primary-600 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg shadow-primary-600/20 mb-1">
                        {{ formatTime(timer.hours) }}
                      </div>
                      <span class="text-[10px] text-surface-500 uppercase font-bold">{{ 'home.hours' | t }}</span>
                    </div>
                    <span class="text-2xl font-bold text-white mb-6">:</span>
                    <div class="flex flex-col items-center">
                      <div class="bg-primary-600 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg shadow-primary-600/20 mb-1">
                        {{ formatTime(timer.minutes) }}
                      </div>
                      <span class="text-[10px] text-surface-500 uppercase font-bold">{{ 'home.minutes' | t }}</span>
                    </div>
                    <span class="text-2xl font-bold text-white mb-6">:</span>
                    <div class="flex flex-col items-center">
                      <div class="bg-primary-600 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg shadow-primary-600/20 mb-1">
                        {{ formatTime(timer.seconds) }}
                      </div>
                      <span class="text-[10px] text-surface-500 uppercase font-bold">{{ 'home.seconds' | t }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Products Grid/Carousel -->
            <div class="flex overflow-x-auto pb-8 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible snap-x no-scrollbar">
              @for (product of flashDeals(); track product._id; let i = $index) {
                <div class="flex-shrink-0 w-64 sm:w-auto snap-start flex flex-col gap-3 group">
                  <div class="relative">
                    <app-product-card [product]="product" [imageIndex]="i"/>
                    <!-- Small over-card timer for each product -->
                    @if (getProductTimer(product._id); as timer) {
                      <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-xl border border-surface-100 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg class="w-3 h-3 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                        </svg>
                        <span class="text-[10px] font-bold text-surface-900">
                          @if (timer.days > 0) { {{ timer.days }}j }
                          {{ formatTime(timer.hours) }}:{{ formatTime(timer.minutes) }}:{{ formatTime(timer.seconds) }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="text-center mt-12">
              <a routerLink="/products" [queryParams]="{onSale: true}" class="group inline-flex items-center gap-3 bg-white/10 hover:bg-primary-600 border border-white/10 hover:border-primary-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl backdrop-blur-md">
                {{ 'home.explorePromotions' | t }}
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      }

      <!-- New Arrivals -->
      <section class="py-10 sm:py-16 bg-gray-50">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900">{{ 'home.newArrivals' | t }}</h2>
              <p class="text-gray-500 mt-0.5 text-xs sm:text-sm hidden sm:block">{{ 'home.latestAdditions' | t }}</p>
            </div>
            <a routerLink="/products" [queryParams]="{sort: '-createdAt'}" class="text-primary-600 font-medium hover:underline flex items-center gap-1 text-sm">
              {{ 'common.viewAll' | t }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          
          @if (newProducts().length > 0) {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
              @for (product of newProducts(); track product._id; let i = $index) {
                <app-product-card [product]="product" [imageIndex]="i"/>
              }
            </div>
          }
        </div>
      </section>

      @if (allProducts().length > 0) {
      <!-- All Products -->
      <section class="py-10 sm:py-16">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900">{{ 'home.allProducts' | t }}</h2>
              <p class="text-gray-500 mt-0.5 text-xs sm:text-sm hidden sm:block">{{ 'home.browseAll' | t }}</p>
            </div>
            <a routerLink="/products" class="text-primary-600 font-medium hover:underline flex items-center gap-1 text-sm">
              {{ 'common.viewAll' | t }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
            @for (product of allProducts(); track product._id; let i = $index) {
              <app-product-card [product]="product" [imageIndex]="i"/>
            }
          </div>
        </div>
      </section>
      }

      @if (bundles().length > 0) {
      <!-- Bundles Section -->
      <section class="py-10 sm:py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-white">{{ 'home.packsBundles' | t }}</h2>
              <p class="text-indigo-100 mt-0.5 text-xs sm:text-base">{{ 'home.saveMorePackages' | t }}</p>
            </div>
            <a routerLink="/bundles" class="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition text-sm whitespace-nowrap">
              {{ 'common.viewAll' | t }}
            </a>
          </div>
          <div class="flex overflow-x-auto pb-2 gap-3 sm:gap-6 md:grid md:grid-cols-3 md:overflow-visible snap-x">
            @for (bundle of bundles(); track bundle._id) {
              <div class="flex-shrink-0 w-64 sm:w-auto snap-start bg-white rounded-xl p-4 hover:shadow-lg transition">
                <h3 class="font-bold text-gray-900 mb-2">{{ bundle?.name }}</h3>
                <p class="text-sm text-gray-500 mb-3 line-clamp-2">{{ bundle?.description }}</p>
                <div class="flex items-baseline gap-2 mb-3 flex-wrap">
                  <span class="text-lg sm:text-xl font-bold text-indigo-600">{{ bundle?.pricing?.price | number:'1.3' }} DT</span>
                  @if (bundle?.pricing?.originalPrice && bundle.pricing.originalPrice > bundle.pricing.price) {
                    <span class="text-xs text-gray-400 line-through">{{ bundle.pricing.originalPrice | number:'1.3' }}</span>
                    <span class="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">-{{ bundle.pricing.discountPercentage }}%</span>
                  }
                </div>
                <a [routerLink]="['/bundles']" class="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                  {{ 'home.viewPack' | t }}
                </a>
              </div>
            }
          </div>
        </div>
      </section>
}

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private seo = inject(SeoService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  i18n = inject(I18nService);
  
  featuredProducts = signal<Product[]>([]);
  newProducts = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  bundles = signal<any[]>([]);
  flashDeals = signal<Product[]>([]);

  productTimers = new Map<string, { days: number; hours: number; minutes: number; seconds: number }>();
  globalHasTimer = false;
  private countdownInterval: any[] = [];
  
  hasFlashDeals(): boolean {
    return this.flashDeals().some(p => this.isFlashDeal(p));
  }
  
  private isFlashDeal(product: Product): boolean {
    if (!product.saleEndsAt) return false;
    const endDate = new Date(product.saleEndsAt).getTime();
    const now = new Date().getTime();
    return endDate > now && this.isProductOnSale(product);
  }

  ngOnDestroy() {
    if (this.countdownInterval.length > 0) {
      this.countdownInterval.forEach(id => clearInterval(id));
    }
  }

  features = [
    { icon: '🚚', title: 'Livraison rapide', desc: '24-48h dans le Grand Tunis' },
    { icon: '🔒', title: 'Paiement sécurisé', desc: 'Paiement à la livraison' },
    { icon: '✅', title: 'Produits authentiques', desc: 'Garantie constructeur' },
    { icon: '🔄', title: 'Retour facile', desc: '7 jours pour changer d\'avis' }
  ];

  categories = [
    { name: 'Smartphones', icon: '📱', slug: 'smartphones' },
    { name: 'Ordinateurs', icon: '💻', slug: 'computers' },
    { name: 'Tablettes', icon: '📲', slug: 'tablets' },
    { name: 'Accessoires', icon: '🎧', slug: 'accessories' },
    { name: 'Montres', icon: '⌚', slug: 'wearables' },
    { name: 'Gaming', icon: '🎮', slug: 'gaming' }
  ];

  whyUs = [
    { title: 'Produits 100% authentiques', desc: 'Tous nos produits sont originaux avec garantie constructeur' },
    { title: 'Support client dédié', desc: 'Notre équipe est disponible pour vous aider 7j/7' },
    { title: 'Livraison express', desc: 'Recevez vos commandes en 24-48h maximum' },
    { title: 'Paiement à la livraison', desc: 'Payez uniquement quand vous recevez votre commande' }
  ];

  ngOnInit() {
    this.seo.updateMeta({
    title: 'Accueil',
    description: 'Tunisia Store - Votre boutique en ligne pour smartphones, ordinateurs et électronique en Tunisie.'
  });
    this.loadFeaturedProducts();
    this.loadNewProducts();
    this.loadAllProducts();
    this.loadBundles();
    this.loadFlashDeals();
    this.startCountdown();
  }

  private loadBundles() {
    this.http.get<any>(`${environment.apiUrl}/bundles`).subscribe({
      next: (res) => this.bundles.set((res.bundles || []).slice(0, 3))
    });
  }

  private loadFeaturedProducts() {
    this.productService.getProducts({ featured: true, limit: 4 }).subscribe({
      next: (res) => this.featuredProducts.set(res.products)
    });
  }

   private loadNewProducts() {
     this.productService.getProducts({ sort: '-createdAt', limit: 4 }).subscribe({
       next: (res) => this.newProducts.set(res.products)
     });
   }

   private loadAllProducts() {
     this.productService.getProducts({ limit: 100 }).subscribe({
       next: (res) => this.allProducts.set(res.products)
     });
   }

private loadFlashDeals() {
      this.productService.getProducts({ onSale: true, limit: 5, sort: 'price-asc' }).subscribe({
        next: (res) => this.flashDeals.set(res.products)
      });
    }

    private startCountdown() {
      // Update timer display every second for smooth countdown
      this.updateProductTimers();
      
      const uiInterval = setInterval(() => {
        this.updateProductTimers();
      }, 1000);

      // Refresh from backend every 15 seconds to get real-time data
      const refreshInterval = setInterval(() => {
        this.loadFlashDealsRefresh();
      }, 15000);

      // Store intervals to clear them on destroy
      this.countdownInterval = [uiInterval, refreshInterval];
    }

    private loadFlashDealsRefresh() {
      this.productService.getProducts({ onSale: true, limit: 5, sort: 'price-asc' }).subscribe({
        next: (res) => this.flashDeals.set(res.products)
      });
    }

    private updateProductTimers() {
      const activeProducts: Product[] = [];
      let hasActiveTimer = false;
      
      this.flashDeals().forEach(product => {
        const isOnSale = this.isProductOnSale(product);
        
        if (!isOnSale) {
          return;
        }
        
        if (product.saleEndsAt) {
          const endDate = new Date(product.saleEndsAt).getTime();
          const now = new Date().getTime();
          const distance = endDate - now;
          
          if (distance > 0) {
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);

            this.productTimers.set(product._id, {
              days: d,
              hours: h, 
              minutes: m,
              seconds: s
            });
            hasActiveTimer = true;
            activeProducts.push(product);
          } else {
            this.productTimers.delete(product._id);
            if (product.badges?.includes('PROMO')) {
              activeProducts.push(product);
            }
          }
        } else {
          this.productTimers.set(product._id, { days: 0, hours: 0, minutes: 0, seconds: 0 });
          activeProducts.push(product);
        }
      });
      
      if (activeProducts.length !== this.flashDeals().length) {
        this.flashDeals.set(activeProducts);
      }
      
      this.globalHasTimer = hasActiveTimer;
      this.cdr.markForCheck();
    }
    
    private isProductOnSale(product: Product): boolean {
      if (product.onSale === true) return true;
      if (product.pricing?.originalPrice && product.pricing?.price) {
        return product.pricing.originalPrice > product.pricing.price;
      }
      return false;
    }

    getSoonestExpiringDeal(): { days: number; hours: number; minutes: number; seconds: number } | null {
      if (this.flashDeals().length === 0) return null;
      
      let soonest: { days: number; hours: number; minutes: number; seconds: number } | null = null;
      let minDistance = Infinity;

      this.flashDeals().forEach(p => {
        if (p.saleEndsAt) {
          const distance = new Date(p.saleEndsAt).getTime() - new Date().getTime();
          if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            soonest = {
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            };
          }
        }
      });
      return soonest;
    }

    getProductTimer(productId: string) {
      return this.productTimers.get(productId);
    }

    formatTime(val: number | undefined): string {
      if (val === undefined || isNaN(val)) return '00';
      return val < 10 ? `0${val}` : `${val}`;
    }

getDiscount(product: Product): number {
      if (!product.pricing?.originalPrice) return 0;
      return Math.round(((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100);
    }

    getStockPercent(product: Product): number {
      const qty = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
      return Math.min(100, Math.max(0, (qty / 10) * 100));
    }

getStockLeft(product: Product): number {
      const qty = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
      return Math.max(0, qty);
    }
}

