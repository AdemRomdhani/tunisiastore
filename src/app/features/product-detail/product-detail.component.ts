import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import { JsonLdComponent } from '../../shared/components/json-ld/json-ld.component';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, JsonLdComponent, ImageUrlPipe, ProductCardComponent, SkeletonComponent],
  styles: [`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .cursor-zoom-in { cursor: zoom-in; }
  `],
  template: `
    <div class="container mx-auto px-4 py-6">
      @if (loading()) {
        <app-skeleton type="product-detail" [count]="4"/>
      } @else if (error()) {
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto text-surface-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h2 class="text-xl font-bold text-surface-700 mb-2">Produit non trouvé</h2>
            <p class="text-surface-500 mb-4">{{ error() }}</p>
            <a routerLink="/products" class="btn-primary">Voir les produits</a>
          </div>
        </div>
      } @else if (product()) {
        <nav class="text-sm text-surface-500 mb-6 flex flex-wrap items-center gap-2">
          <a routerLink="/" class="hover:text-primary-600">Accueil</a>
          <span class="text-surface-300">/</span>
          <a routerLink="/products" class="hover:text-primary-600">Produits</a>
          @if (product()?.category) {
            <span class="text-surface-300">/</span>
            <a [routerLink]="['/products']" [queryParams]="{category: product()?.category?.slug}" class="hover:text-primary-600">{{ product()?.category?.name }}</a>
          }
          <span class="text-surface-300">/</span>
          <span class="text-surface-800 truncate max-w-[200px] font-medium">{{ product()?.name }}</span>
        </nav>
        <app-json-ld [data]="structuredData()"/>
        <div class="grid lg:grid-cols-2 gap-8">
          <div class="space-y-4">
            <div class="bg-surface-50 rounded-2xl shadow-card p-6 relative overflow-hidden group">
              <div class="relative cursor-zoom-in" (click)="toggleZoom()" (mousemove)="onImageMouseMove($event, mainImage)" #imageContainer>
                <img #mainImage [src]="selectedImage() | imageUrl" [alt]="product()?.name" class="w-full max-w-lg mx-auto h-auto transition-transform duration-300" [class.scale-150]="zoomEnabled()" [style.transform-origin]="zoomEnabled() ? zoomPosition().x + '% ' + zoomPosition().y + '%' : 'center center'" width="500" height="500" loading="eager">
                @if (!zoomEnabled()) {
                  <div class="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Zoom</div>
                }
              </div>
            </div>
            <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              @for (img of product()?.media?.images || []; track img; let i = $index) {
                <button (click)="setImage(img); zoomEnabled.set(false)" [class.ring-2]="selectedImage() === img" [class.ring-primary-600]="selectedImage() === img" class="w-16 h-16 md:w-20 md:h-20 bg-surface-50 rounded-xl p-2 border-2 border-transparent flex-shrink-0 hover:border-primary-300 transition-all">
                  <img [src]="img | imageUrl" [alt]="(product()?.name || '') + ' - image ' + (i+1)" class="w-full h-full object-contain" width="80" height="80" loading="lazy">
                </button>
              }
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-3">
              @if (product()?.badges?.includes('NEW')) {
                <span class="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg">NOUVEAU</span>
              }
              @if (discount() > 0) {
                <span class="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-lg">-{{ discount() }}%</span>
              }
            </div>
            <h1 class="text-2xl md:text-3xl font-bold text-surface-900 mb-4">{{ product()?.name }}</h1>
            @if (product()?.ratings?.count) {
              <div class="flex items-center gap-3 mb-5">
                <div class="flex text-yellow-400">
                  @for (star of [1,2,3,4,5]; track star) {
                    <svg class="w-5 h-5" [class.text-surface-200]="star > (product()?.ratings?.average || 0)" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  }
                </div>
                <span class="text-sm text-surface-500">{{ product()?.ratings?.count }} avis</span>
              </div>
            }
            <div class="flex items-baseline gap-3 mb-5">
              <span class="text-3xl md:text-4xl font-bold text-primary-600">{{ product()?.pricing?.price | number:'1.3' }} DT</span>
              @if (product()?.pricing?.originalPrice) {
                <span class="text-lg text-surface-400 line-through">{{ product()?.pricing?.originalPrice | number:'1.3' }} DT</span>
              }
            </div>
            <p class="text-surface-600 mb-6 leading-relaxed">{{ product()?.shortDescription || product()?.description }}</p>
            <div class="flex items-center gap-3 mb-6">
              @if (availableStock() > 0) {
                <span class="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  En stock ({{ availableStock() }})
                </span>
              } @else {
                <span class="flex items-center gap-2 text-red-500 text-sm font-medium">Rupture de stock</span>
              }
            </div>
            <div class="flex gap-3 mb-6">
              <div class="flex items-center border border-surface-200 rounded-xl">
                <button (click)="decreaseQty()" class="w-12 h-12 flex items-center justify-center hover:bg-surface-100 rounded-l-xl">-</button>
                <span class="w-14 text-center font-semibold text-lg">{{ quantity() }}</span>
                <button (click)="increaseQty()" [disabled]="quantity() >= availableStock()" class="w-12 h-12 flex items-center justify-center hover:bg-surface-100 rounded-r-xl disabled:opacity-50">+</button>
              </div>
              <button (click)="addToCart()" [disabled]="availableStock() === 0 || addingToCart()" class="flex-1 btn-primary text-base">
                @if (addingToCart()) { <span>Ajout...</span> } @else { Ajouter au panier }
              </button>
            </div>
            @if (product()?.warranty) {
              <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                <div class="flex items-center gap-2.5 text-blue-800 text-sm">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span class="font-semibold">Garantie {{ product()?.warranty?.duration }} mois</span>
                </div>
              </div>
            }
            <div class="text-sm text-surface-400">Référence: <span class="font-mono bg-surface-100 px-2 py-1 rounded">{{ product()?.inventory?.sku || 'N/A' }}</span></div>
          </div>
        </div>
        @if (relatedProducts().length > 0) {
          <div class="mt-10">
            <h2 class="text-xl font-bold mb-5 text-surface-800">Produits similaires</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              @for (prod of relatedProducts(); track prod._id) {
                <app-product-card [product]="prod"/>
              }
            </div>
          </div>
        }
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private seo = inject(SeoService);
  private toast = inject(ToastService);

  product = signal<Product | null>(null);
  selectedImage = signal('');
  quantity = signal(1);
  addingToCart = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  reviews = signal<any[]>([]);
  relatedProducts = signal<Product[]>([]);
  newReviewRating = signal(0);
  newReviewTitle = '';
  newReviewComment = '';
  submittingReview = signal(false);
  zoomEnabled = signal(false);
  zoomPosition = signal({ x: 0, y: 0 });

  get isLoggedIn() { return this.authService.currentUser() !== null; }

  setRating(rating: number) { this.newReviewRating.set(rating); }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const slug = params['slug'] as string;
      this.loading.set(true);
      this.error.set(null);
      this.productService.getProduct(slug).subscribe({
        next: (res) => {
          if (res.success && res.product) {
            this.product.set(res.product);
            this.selectedImage.set(res.product.media.images[0]);
            this.seo.updateMeta({ title: res.product.name, description: res.product.description });
          } else {
            this.error.set('Produit non trouvé');
          }
          this.loading.set(false);
        },
        error: () => { this.error.set('Erreur de chargement'); this.loading.set(false); }
      });
      if (slug) {
        this.loadRelatedProducts(slug);
        this.loadReviews(slug);
      }
    });
  }

  loadRelatedProducts(slug: string) {
    this.productService.getProducts({ category: '', limit: 4 }).subscribe({ next: (res) => this.relatedProducts.set(res.products.filter(p => p.slug !== slug).slice(0, 4)) });
  }

  loadReviews(slug: string) {
    this.productService.getProductReviews(slug).subscribe({ next: (res) => this.reviews.set(res.reviews || []) });
  }

  setImage(img: string) { this.selectedImage.set(img); }
  toggleZoom() { this.zoomEnabled.update(v => !v); }

  onImageMouseMove(e: MouseEvent, img: HTMLImageElement) {
    if (!this.zoomEnabled()) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    this.zoomPosition.set({ x, y });
  }

  availableStock = computed(() => { const p = this.product(); if (!p) return 0; return Math.max(0, (p.inventory?.quantity || 0) - (p.inventory?.reserved || 0)); });
  discount = computed(() => { const p = this.product(); if (!p?.pricing?.originalPrice) return 0; return Math.round(((p.pricing.originalPrice - p.pricing.price) / p.pricing.originalPrice) * 100); });

  decreaseQty() { this.quantity.update(q => Math.max(1, q - 1)); }
  increaseQty() { const max = this.availableStock(); this.quantity.update(q => Math.min(max, q + 1)); }

  addToCart() {
    const p = this.product(); if (!p) return;
    const qty = this.quantity(); const available = this.availableStock();
    if (qty > available) { this.toast.error('Erreur', `Stock insuffisant. Disponible: ${available}`); return; }
    this.addingToCart.set(true);
    this.cartService.addToCart(p._id, qty).subscribe({
      next: () => { this.cartService.refreshCart(); this.addingToCart.set(false); this.toast.success('Succès', `${p.name} ajouté au panier`); },
      error: () => { this.addingToCart.set(false); }
    });
  }

  structuredData = computed(() => {
    const p = this.product(); if (!p) return {};
    return { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: `https://tunisiastore.tn${p.media.images[0]}`, offers: { '@type': 'Offer', priceCurrency: 'TND', price: p.pricing.price, availability: this.availableStock() > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } };
  });

  submitReview() {
    if (!this.newReviewRating() || !this.newReviewTitle || !this.newReviewComment) return;
    this.submittingReview.set(true);
    const productId = this.product()?._id;
    if (!productId) return;
    this.productService.addReview(productId, { rating: this.newReviewRating(), title: this.newReviewTitle, comment: this.newReviewComment }).subscribe({
      next: () => { this.loadReviews(productId); this.submittingReview.set(false); this.newReviewRating.set(0); this.newReviewTitle = ''; this.newReviewComment = ''; },
      error: () => this.submittingReview.set(false)
    });
  }
}