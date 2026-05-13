import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService, Product, ProductFilters } from '../../core/services/product.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent, SkeletonComponent, EmptyStateComponent, TranslatePipe],
  template: `
    <div class="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden mb-4 flex items-center justify-between">
        <h1 class="text-lg sm:text-xl font-bold text-surface-800 truncate">
          {{ getPageTitle() }}
        </h1>
        <div class="flex items-center gap-2">
          @if (hasActiveFilters()) {
            <button 
              (click)="clearFilters()"
              class="text-xs text-primary-600 font-medium hover:underline"
            >
              {{ 'products.reset' | t }}
            </button>
          }
          <button 
            (click)="filterOpen.set(!filterOpen())"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            {{ 'products.filters' | t }}
            @if (hasActiveFilters()) {
              <span class="w-2 h-2 bg-primary-600 rounded-full"></span>
            }
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <!-- Sidebar Filters - Desktop -->
        <aside class="hidden lg:block w-64 flex-shrink-0">
          <div class="bg-surface-50 rounded-2xl shadow-card p-6 sticky top-24">
<h3 class="font-bold text-lg text-surface-800 mb-5">{{ 'products.filters' | t }}</h3>
             
            <div class="mb-6">
              <label class="block text-sm font-medium text-surface-700 mb-2">{{ 'products.search' | t }}</label>
              <div class="relative">
                <input 
                  type="text" 
                  [ngModel]="searchQuery()"
                  (ngModelChange)="onSearchChange($event)"
                  [placeholder]="i18n.t('products.searchPlaceholder')"
                  class="input-field pr-10 text-sm"
                >
                @if (searchQuery()) {
                  <button (click)="clearSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>
            </div>

            <div class="mb-6">
              <h4 class="font-medium mb-3 text-surface-800">Catégories</h4>
              <div class="space-y-1 max-h-52 overflow-y-auto py-1">
                <label class="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-surface-100 transition-colors">
                  <input type="radio" name="category" value="" [checked]="selectedCategory() === ''" (change)="selectCategory('')" class="w-4 h-4 text-primary-600 rounded-full border-surface-300 focus:ring-primary-500">
                  <span class="text-sm text-surface-600">{{ 'products.allCategories' | t }}</span>
                </label>
                @for (cat of categories(); track cat._id) {
                  <label class="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-surface-100 transition-colors">
                    <input type="radio" name="category" [value]="cat.slug" [checked]="selectedCategory() === cat.slug" (change)="selectCategory(cat.slug)" class="w-4 h-4 text-primary-600 rounded-full border-surface-300 focus:ring-primary-500">
                    <span class="text-sm text-surface-600">{{ cat.name }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="mb-6">
              <h4 class="font-medium mb-3 text-surface-800">{{ 'products.priceRange' | t }}</h4>
              <div class="flex gap-2">
                <input type="number" [(ngModel)]="minPrice" [placeholder]="i18n.t('products.min')" class="input-field text-sm flex-1">
                <input type="number" [(ngModel)]="maxPrice" [placeholder]="i18n.t('products.max')" class="input-field text-sm flex-1">
              </div>
              <button (click)="applyPriceFilter()" class="btn-secondary w-full mt-3 text-sm">{{ 'products.apply' | t }}</button>
            </div>

            <div>
              <h4 class="font-medium mb-3 text-surface-800">{{ 'products.sortBy' | t }}</h4>
              <select [(ngModel)]="sortOrder" (change)="updateSort($event)" class="input-field text-sm">
                <option value="-createdAt">{{ 'products.newest' | t }}</option>
                <option value="price-asc">{{ 'products.priceAsc' | t }}</option>
                <option value="price-desc">{{ 'products.priceDesc' | t }}</option>
                <option value="rating">{{ 'products.topRated' | t }}</option>
              </select>
            </div>

            @if (hasActiveFilters()) {
              <button (click)="clearFilters()" class="w-full mt-6 text-primary-600 text-sm font-medium hover:text-primary-700 transition-colors">
                {{ 'products.resetFilters' | t }}
              </button>
            }
          </div>
        </aside>

        <!-- Mobile Filter Drawer -->
        @if (filterOpen()) {
          <div class="lg:hidden fixed inset-0 z-40 bg-black/50" (click)="filterOpen.set(false)">
            <div class="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto" (click)="$event.stopPropagation()">
              <div class="sticky top-0 bg-white border-b border-surface-200 px-4 py-3 flex items-center justify-between">
                <h3 class="font-bold text-lg text-surface-800">{{ 'products.filters' | t }}</h3>
                <button (click)="filterOpen.set(false)" class="p-2 text-surface-400 hover:text-surface-600 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div class="p-4">
                <div class="mb-5">
                  <label class="block text-sm font-medium text-surface-700 mb-2">{{ 'products.search' | t }}</label>
                  <div class="relative">
                    <input type="text" [ngModel]="searchQuery()" (ngModelChange)="onSearchChange($event)" [placeholder]="i18n.t('products.searchPlaceholder')" class="input-field pr-10 text-sm">
                    @if (searchQuery()) {
                      <button (click)="clearSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    }
                  </div>
                </div>

                <div class="mb-5">
                  <h4 class="font-medium mb-3 text-surface-800">{{ 'nav.categories' | t }}</h4>
                  <div class="space-y-1">
                    <label class="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-surface-100 transition-colors">
                      <input type="radio" name="cat-mobile" value="" [checked]="selectedCategory() === ''" (change)="selectCategory('')" class="w-4 h-4 text-primary-600 rounded-full">
                      <span class="text-sm text-surface-600">{{ 'products.allCategories' | t }}</span>
                    </label>
                    @for (cat of categories(); track cat._id) {
                      <label class="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-surface-100 transition-colors">
                        <input type="radio" name="cat-mobile" [value]="cat.slug" [checked]="selectedCategory() === cat.slug" (change)="selectCategory(cat.slug)" class="w-4 h-4 text-primary-600 rounded-full">
                        <span class="text-sm text-surface-600">{{ cat.name }}</span>
                      </label>
                    }
                  </div>
                </div>

                <div class="mb-5">
                  <h4 class="font-medium mb-3 text-surface-800">{{ 'products.priceRange' | t }}</h4>
                  <div class="flex gap-2">
                    <input type="number" [(ngModel)]="minPrice" [placeholder]="i18n.t('products.min')" class="input-field text-sm flex-1">
                    <input type="number" [(ngModel)]="maxPrice" [placeholder]="i18n.t('products.max')" class="input-field text-sm flex-1">
                  </div>
                  <button (click)="applyPriceFilter()" class="btn-secondary w-full mt-3 text-sm">{{ 'products.apply' | t }}</button>
                </div>

                <div class="mb-5">
                  <h4 class="font-medium mb-3 text-surface-800">{{ 'products.sortBy' | t }}</h4>
                  <select [(ngModel)]="sortOrder" (change)="updateSort($event)" class="input-field text-sm">
                    <option value="-createdAt">{{ 'products.newest' | t }}</option>
                    <option value="price-asc">{{ 'products.priceAsc' | t }}</option>
                    <option value="price-desc">{{ 'products.priceDesc' | t }}</option>
                    <option value="rating">{{ 'products.topRated' | t }}</option>
                  </select>
                </div>

                @if (hasActiveFilters()) {
                  <button (click)="clearFilters()" class="w-full py-2.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
                    {{ 'products.resetFilters' | t }}
                  </button>
                }

                <button (click)="filterOpen.set(false)" class="w-full mt-3 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors">
                  {{ 'products.viewResults' | t }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Products Grid -->
        <div class="flex-1">
          @if (bundles().length > 0) {
            <div class="mb-4 sm:mb-6 animate-fade-in">
              <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 class="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1">{{ 'products.packsBundles' | t }}</h2>
                    <p class="text-indigo-100 text-xs sm:text-sm">{{ 'products.saveMore' | t }}</p>
                  </div>
                  <a routerLink="/bundles" class="bg-white text-indigo-600 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-medium hover:bg-indigo-50 transition-all duration-200 whitespace-nowrap">
                    {{ 'products.viewPacks' | t }}
                  </a>
                </div>
                <div class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-5">
                  @for (bundle of bundles().slice(0, 3); track bundle._id) {
                    <div class="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/20 transition-all duration-200 cursor-pointer group" [routerLink]="['/bundles']">
                      <p class="text-white font-medium text-xs sm:text-sm truncate">{{ bundle.name }}</p>
                      <div class="flex items-baseline gap-2 mt-1">
                        <span class="text-white font-bold text-base sm:text-lg">{{ bundle.pricing.price | number:'1.3-3' }} DT</span>
                        @if (bundle.pricing.discountPercentage > 0) {
                          <span class="text-xs text-indigo-200 line-through">{{ bundle.pricing.originalPrice | number:'1.3-3' }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          
          <!-- Header - Desktop -->
          <div class="hidden lg:flex items-center justify-between mb-6">
            <h1 class="text-xl font-bold text-surface-800">{{ getPageTitle() }}</h1>
            <span class="text-sm text-surface-500">{{ i18n.t('products.productsCount', { count: pagination().total || 0 }) }}</span>
          </div>

          @if (loading()) {
            <app-skeleton type="product-list" [count]="8" gridClass="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"/>
          } @else if (products().length === 0) {
            <app-empty-state
              [title]="i18n.t('products.noProducts')"
              [description]="searchQuery() ? i18n.t('products.tryOtherSearch') : i18n.t('products.noProductsYet')"
              icon="products"
              [actionLabel]="i18n.t('products.resetFilters')"
              (actionClick)="clearFilters()"
            />
          } @else {
            <div class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              @for (product of products(); track product._id) {
                <app-product-card [product]="product"/>
              }
            </div>

            @if (pagination().pages > 1) {
              <div class="flex flex-wrap justify-center mt-8 sm:mt-12 gap-1.5 sm:gap-2">
                <button (click)="changePage(pagination().current - 1)" [disabled]="pagination().current === 1" class="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-surface-200 rounded-lg sm:rounded-xl hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {{ 'products.previous' | t }}
                </button>
                @for (page of getPageNumbers(); track page) {
                  <button (click)="changePage(page)" [class.bg-primary-600]="page === pagination().current" [class.text-white]="page === pagination().current" [class.border-primary-600]="page === pagination().current" class="w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm border border-surface-200 rounded-lg sm:rounded-xl hover:bg-surface-50 font-medium transition-colors">
                    {{ page }}
                  </button>
                }
                <button (click)="changePage(pagination().current + 1)" [disabled]="pagination().current === pagination().pages" class="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-surface-200 rounded-lg sm:rounded-xl hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {{ 'products.next' | t }}
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  i18n = inject(I18nService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  bundles = signal<any[]>([]);
  loading = signal(true);

  pagination = signal({ page: 1, limit: 12, pages: 1, total: 0, current: 1 });

  searchQuery = signal('');
  selectedCategory = signal('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  sortOrder = signal('-createdAt');
  filterOpen = signal(false);

  filters: ProductFilters = {};

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadCategories();
    this.loadBundles();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.filters.search = query || undefined;
      this.pagination.update(p => ({ ...p, page: 1 }));
      this.loadProducts();
    });

    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory.set(params['category']);
        this.filters.category = params['category'];
      }
      if (params['search']) {
        this.searchQuery.set(params['search']);
        this.filters.search = params['search'];
      }
      if (params['minPrice']) this.minPrice.set(+params['minPrice']);
      if (params['maxPrice']) this.maxPrice.set(+params['maxPrice']);
      if (params['onSale']) this.filters.onSale = true;
      if (params['sort']) this.sortOrder.set(params['sort']);
      this.loadProducts();
    });
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => { this.categories.set(res.categories); this.cd.markForCheck(); }
    });
  }

  private loadBundles() {
    this.http.get<any>(`${environment.apiUrl}/bundles`).subscribe({
      next: (res) => { this.bundles.set(res.bundles || []); this.cd.markForCheck(); }
    });
  }

  loadProducts() {
    this.loading.set(true);
    const page = this.pagination();
    
    this.productService.getProducts({
      ...this.filters,
      page: page.page,
      limit: page.limit,
      sort: this.sortOrder()
    }).subscribe({
      next: (res) => {
          this.ngZone.run(() => {
          const page = res.pagination || { page: 1, limit: 12, pages: 1, total: 0 };
          this.products.set(res.products);
          this.pagination.set({
            page: page.page,
            limit: page.limit,
            pages: page.pages,
            total: page.total,
            current: page.page
          });
          this.loading.set(false);
          this.cd.markForCheck();
          
          this.seo.updateMeta({
            title: this.getPageTitle(),
            description: `Découvrez notre collection de ${page.total} produits`
          });
        });
      },
      error: () => { this.ngZone.run(() => { this.loading.set(false); this.cd.markForCheck(); }); }
    });
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.filters.search = undefined;
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  selectCategory(slug: string) {
    this.selectedCategory.set(slug);
    this.filters.category = slug || undefined;
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  applyPriceFilter() {
    if (this.minPrice() || this.maxPrice()) {
      this.filters.minPrice = this.minPrice() || undefined;
      this.filters.maxPrice = this.maxPrice() || undefined;
    } else {
      delete this.filters.minPrice;
      delete this.filters.maxPrice;
    }
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  updateFilter(key: string, value: string) {
    (this.filters as any)[key] = value;
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  updateSort(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFilter('sort', value);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.sortOrder.set('-createdAt');
    this.filters = {};
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadProducts();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.selectedCategory() || 
             this.minPrice() || this.maxPrice() || this.filters.onSale);
  }

  changePage(page: number) {
    this.pagination.update(p => ({ ...p, page }));
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const pages = this.pagination().pages;
    const current = this.pagination().current;
    const result: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(pages, 5);
      } else {
        start = Math.max(1, pages - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    
    return result;
  }

  getPageTitle(): string {
    if (this.searchQuery()) return `Résultats pour "${this.searchQuery()}"`;
    if (this.selectedCategory()) {
      const cat = this.categories().find(c => c.slug === this.selectedCategory());
      return cat?.name || 'Produits';
    }
    if (this.filters.onSale) return 'Promotions';
    return 'Tous les produits';
  }
}