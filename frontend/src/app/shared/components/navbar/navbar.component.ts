import { Component, OnInit, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CompareService } from '../../../core/services/compare.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <nav class="bg-white shadow-card sticky top-0 z-50">
      <!-- Top bar -->
      <div class="bg-primary-700 text-white text-xs sm:text-sm">
        <div class="container mx-auto px-4 py-1.5 sm:py-2 flex justify-between items-center">
          <div class="flex items-center gap-3 sm:gap-6">
            <span class="flex items-center gap-1.5 sm:gap-2">
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span class="hidden xs:inline">+216 55226228</span>
            </span>
            <span class="hidden sm:inline text-primary-200">•</span>
            <span class="hidden sm:inline text-xs">{{ 'nav.freeShipping' | t }}</span>
          </div>
          <div class="flex items-center gap-3 sm:gap-5">
            <app-language-switcher />
            @if (authService.isAuthenticated()) {
              <a routerLink="/profile" class="hover:text-primary-200 flex items-center gap-1.5 sm:gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="hidden lg:inline">{{ 'nav.account' | t }}</span>
              </a>
              <a routerLink="/wishlist" class="hover:text-primary-200 flex items-center gap-1.5 sm:gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                <span class="hidden lg:inline">{{ 'nav.wishlist' | t }}</span>
              </a>
              <button (click)="logout()" class="hover:text-primary-200 transition-colors text-xs sm:text-sm">{{ 'nav.logout' | t }}</button>
            } @else {
              <a routerLink="/login" class="hover:text-primary-200 transition-colors text-xs sm:text-sm">{{ 'nav.login' | t }}</a>
              <a routerLink="/register" class="hover:text-primary-200 transition-colors text-xs sm:text-sm">{{ 'nav.register' | t }}</a>
            }
          </div>
        </div>
      </div>

      <!-- Main navbar -->
      <div class="container mx-auto px-3 sm:px-4 py-2 sm:py-3 lg:py-4">
        <div class="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          <!-- Hamburger + Logo -->
          <div class="flex items-center gap-2">
            <button 
              (click)="toggleMobileMenu($event)"
              class="lg:hidden p-2 -ml-2 text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
            >
              @if (mobileMenuOpen()) {
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              } @else {
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              }
            </button>
            <a routerLink="/" class="flex items-center gap-2 sm:gap-3 group">
              <div class="w-9 h-9 sm:w-11 sm:h-11 bg-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span class="text-white font-bold text-sm sm:text-xl">TS</span>
              </div>
              <span class="text-base sm:text-xl font-bold text-surface-900 hidden sm:block">Tunisia Store</span>
            </a>
          </div>

          <!-- Search - Desktop -->
          <div class="hidden lg:block flex-1 max-w-2xl">
            <div class="relative">
              <input 
                type="text" 
                [(ngModel)]="searchInput"
                (input)="onSearchInput($event)"
                (keyup.enter)="doSearch()"
                (keydown.arrowDown)="navigateDown($event)"
                (keydown.arrowUp)="navigateUp($event)"
                (keydown.enter)="selectHighlighted()"
                (focus)="showDropdown = true"
                [placeholder]="i18n.t('common.search')"
                class="w-full pl-5 pr-14 py-2.5 sm:py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm sm:text-base"
                autocomplete="off"
              >
              <button (click)="doSearch()" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-surface-400 hover:text-primary-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>

              <!-- Autocomplete Dropdown -->
              @if (showDropdown && (searchResults().length > 0 || (searchInput.length > 0 && !loading()))) {
                <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-50">
                  @if (loading()) {
                    <div class="px-4 py-3 text-sm text-surface-500">Recherche en cours...</div>
                  } @else {
                    @for (product of searchResults(); track product._id; let i = $index) {
                      <button 
                        (click)="selectProduct(product)"
                        (mouseenter)="highlightedIndex = i"
                        [class.bg-primary-50]="highlightedIndex === i"
                        class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors"
                      >
                        @if (product.media?.images?.length > 0) {
                          <img [src]="product.media.images[0] | imageUrl" [alt]="product.name" class="w-10 h-10 object-cover rounded-lg flex-shrink-0">
                        } @else {
                          <div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          </div>
                        }
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-surface-800 truncate">{{ product.name }}</p>
                          <p class="text-xs text-surface-500 truncate">{{ product.category?.name }}</p>
                        </div>
                        <div class="flex-shrink-0">
                          <span class="text-sm font-bold text-primary-600">{{ product.pricing?.price | number:'1.0-0' }} DT</span>
                        </div>
                      </button>
                    }
                    @if (searchResults().length === 0 && searchInput.length > 0) {
                      <div class="px-4 py-3 text-sm text-surface-500">Aucun produit trouvé</div>
                    }
                    <button 
                      (click)="doSearch()"
                      class="w-full px-4 py-2 text-xs text-center text-primary-600 hover:bg-primary-50 border-t border-surface-100 font-medium transition-colors"
                    >
                      Voir tous les résultats pour "{{ searchInput }}"
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Mobile Search Button -->
          <button 
            (click)="toggleMobileSearch()"
            class="lg:hidden p-2.5 text-surface-700 hover:bg-surface-100 rounded-xl transition-colors"
          >
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>

          <!-- Actions -->
          <div class="flex items-center gap-1 sm:gap-1.5">
            @if (authService.isAdmin() || authService.isSupervisor()) {
              <a routerLink="/admin" class="hidden sm:flex p-2.5 hover:bg-surface-100 rounded-xl transition-colors text-primary-600 font-semibold text-sm">
                Admin
              </a>
            }
            <a routerLink="/compare" class="relative p-2 sm:p-2.5 hover:bg-surface-100 rounded-xl transition-colors">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              @if (compareService.count() > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
                  {{ compareService.count() }}
                </span>
              }
            </a>
            <a routerLink="/cart" class="relative p-2 sm:p-2.5 hover:bg-surface-100 rounded-xl transition-colors">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              @if (cartCount() > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
                  {{ cartCount() }}
                </span>
              }
            </a>
          </div>
        </div>

        <!-- Mobile Search Bar -->
        @if (mobileSearchOpen()) {
          <div class="lg:hidden mt-3 pb-1">
            <div class="relative">
              <input 
                type="text" 
                [(ngModel)]="searchInput"
                (input)="onSearchInput($event)"
                (keyup.enter)="doSearch(); mobileSearchOpen.set(false)"
                (keydown.arrowDown)="navigateDown($event)"
                (keydown.arrowUp)="navigateUp($event)"
                (keydown.enter)="selectHighlighted()"
                (focus)="showDropdown = true"
                placeholder="Rechercher un produit..."
                class="w-full pl-4 pr-12 py-2.5 text-sm border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                autocomplete="off"
                #mobileSearchInput
              >
              <button (click)="doSearch(); mobileSearchOpen.set(false)" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-surface-400 hover:text-primary-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>

              @if (showDropdown && (searchResults().length > 0 || (searchInput.length > 0 && !loading()))) {
                <div class="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
                  @if (loading()) {
                    <div class="px-4 py-3 text-sm text-surface-500">Recherche en cours...</div>
                  } @else {
                    @for (product of searchResults(); track product._id; let i = $index) {
                      <button 
                        (click)="selectProduct(product); mobileSearchOpen.set(false)"
                        (mouseenter)="highlightedIndex = i"
                        [class.bg-primary-50]="highlightedIndex === i"
                        class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors"
                      >
                        @if (product.media?.images?.length > 0) {
                          <img [src]="product.media.images[0] | imageUrl" [alt]="product.name" class="w-10 h-10 object-cover rounded-lg flex-shrink-0">
                        } @else {
                          <div class="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          </div>
                        }
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-surface-800 truncate">{{ product.name }}</p>
                          <p class="text-xs text-surface-500 truncate">{{ product.category?.name }}</p>
                        </div>
                        <div class="flex-shrink-0">
                          <span class="text-sm font-bold text-primary-600">{{ product.pricing?.price | number:'1.0-0' }} DT</span>
                        </div>
                      </button>
                    }
                    @if (searchResults().length === 0 && searchInput.length > 0) {
                      <div class="px-4 py-3 text-sm text-surface-500">Aucun produit trouvé</div>
                    }
                    <button 
                      (click)="doSearch(); mobileSearchOpen.set(false)"
                      class="w-full px-4 py-2.5 text-sm text-center text-primary-600 hover:bg-primary-50 border-t border-surface-100 font-medium transition-colors"
                    >
                      Voir tous les résultats pour "{{ searchInput }}"
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Categories bar - Desktop -->
      <div class="border-t border-surface-100 hidden lg:block">
        <div class="container mx-auto px-4">
          <div class="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
            @for (cat of categories(); track cat._id) {
              <a 
                [routerLink]="['/products']" 
                [queryParams]="{category: cat.slug}"
                class="px-4 py-2 text-sm font-medium text-surface-600 hover:text-primary-600 hover:bg-surface-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {{ cat.name }}
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Mobile Menu Drawer -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-40 mt-[calc(3rem+48px)] sm:mt-[calc(3.5rem+52px)]">
          <div class="bg-white h-full overflow-y-auto shadow-xl border-t border-surface-200">
            <!-- User section -->
            <div class="p-4 border-b border-surface-100 bg-surface-50">
              @if (authService.isAuthenticated()) {
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-surface-800 text-sm">{{ 'nav.account' | t }}</p>
                    <a routerLink="/profile" (click)="mobileMenuOpen.set(false)" class="text-xs text-primary-600 hover:underline">{{ 'nav.profile' | t }}</a>
                  </div>
                </div>
                <div class="flex gap-2">
                  <a routerLink="/wishlist" (click)="mobileMenuOpen.set(false)" class="flex-1 py-2 text-center text-sm text-surface-600 hover:text-primary-600 border border-surface-200 rounded-lg transition-colors">
                    {{ 'nav.wishlist' | t }}
                  </a>
                  <button (click)="logout(); mobileMenuOpen.set(false)" class="flex-1 py-2 text-center text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                    {{ 'nav.logout' | t }}
                  </button>
                </div>
              } @else {
                <div class="flex gap-2">
                  <a routerLink="/login" (click)="mobileMenuOpen.set(false)" class="flex-1 py-2.5 text-center text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg transition-colors">
                    {{ 'nav.login' | t }}
                  </a>
                  <a routerLink="/register" (click)="mobileMenuOpen.set(false)" class="flex-1 py-2.5 text-center text-sm font-medium text-white bg-primary-600 rounded-lg transition-colors">
                    {{ 'nav.register' | t }}
                  </a>
                </div>
              }
              @if (authService.isAdmin() || authService.isSupervisor()) {
                <a routerLink="/admin" (click)="mobileMenuOpen.set(false)" class="mt-2 flex items-center gap-2 w-full py-2 px-3 text-sm text-primary-600 font-medium bg-primary-50 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ 'nav.admin' | t }}
                </a>
              }
            </div>

            <!-- Categories -->
            <div class="p-4">
              <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">{{ 'nav.categories' | t }}</h3>
              <div class="space-y-1">
                @for (cat of categories(); track cat._id) {
                  <a 
                    [routerLink]="['/products']" 
                    [queryParams]="{category: cat.slug}"
                    (click)="mobileMenuOpen.set(false)"
                    class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-surface-700 hover:text-primary-600 hover:bg-surface-50 rounded-lg transition-colors"
                  >
                    <span>{{ cat.name }}</span>
                  </a>
                }
              </div>
            </div>

            <!-- Quick links -->
            <div class="p-4 border-t border-surface-100">
              <div class="space-y-1">
                <a routerLink="/products" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-surface-700 hover:text-primary-600 hover:bg-surface-50 rounded-lg transition-colors">
                  {{ 'nav.products' | t }}
                </a>
                <a routerLink="/bundles" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-surface-700 hover:text-primary-600 hover:bg-surface-50 rounded-lg transition-colors">
                  {{ 'nav.bundles' | t }}
                </a>
              </div>
            </div>

            <!-- Contact -->
            <div class="p-4 border-t border-surface-100 bg-surface-50">
              <div class="flex items-center gap-2 text-xs text-surface-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span>+216 55226228</span>
              </div>
              <p class="text-xs text-surface-400 mt-1">Livraison gratuite dès 200 DT</p>
            </div>
          </div>
        </div>
      }
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private cartService = inject(CartService);
  compareService = inject(CompareService);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private el = inject(ElementRef);
  i18n = inject(I18nService);

  categories = signal<Category[]>([]);
  searchResults = signal<any[]>([]);
  loading = signal(false);
  showDropdown = false;
  highlightedIndex = -1;
  mobileMenuOpen = signal(false);
  mobileSearchOpen = signal(false);
  apiUrl = environment.production
    ? 'https://tunisiastore.onrender.com'
    : environment.apiUrl.replace('/api', '');

  searchInput = '';

  cartCount = this.cartService.itemCount;

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => this.categories.set(res.categories)
    });

    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim().length < 1) {
        this.searchResults.set([]);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.productService.autocomplete(query).subscribe({
        next: (res) => {
          this.searchResults.set(res.results || []);
          this.loading.set(false);
          this.highlightedIndex = -1;
        },
        error: () => this.loading.set(false)
      });
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const isHamburgerBtn = target.closest('button')?.classList.contains('lg:hidden');
    
    if (!this.el.nativeElement.contains(target) || isHamburgerBtn) {
      return;
    }
    
    const inMobileMenu = target.closest('.lg\\:hidden.fixed');
    if (!inMobileMenu) {
      this.showDropdown = false;
      this.mobileSearchOpen.set(false);
    }
  }

  toggleMobileMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.mobileMenuOpen.update(v => !v);
    if (this.mobileMenuOpen()) {
      this.mobileSearchOpen.set(false);
    }
  }

  toggleMobileSearch() {
    this.mobileSearchOpen.update(v => !v);
    if (this.mobileSearchOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput = value;
    this.showDropdown = true;
    this.searchSubject.next(value);
  }

  navigateDown(event: Event) {
    event.preventDefault();
    if (this.highlightedIndex < this.searchResults().length - 1) {
      this.highlightedIndex++;
    }
  }

  navigateUp(event: Event) {
    event.preventDefault();
    if (this.highlightedIndex > 0) {
      this.highlightedIndex--;
    } else if (this.highlightedIndex === 0) {
      this.highlightedIndex = -1;
    }
  }

  selectHighlighted() {
    if (this.highlightedIndex >= 0 && this.searchResults()[this.highlightedIndex]) {
      this.selectProduct(this.searchResults()[this.highlightedIndex]);
    } else {
      this.doSearch();
    }
  }

  selectProduct(product: any) {
    this.showDropdown = false;
    this.mobileSearchOpen.set(false);
    this.searchInput = '';
    this.searchResults.set([]);
    this.router.navigate(['/product', product.slug]);
  }

  doSearch() {
    if (this.searchInput.trim()) {
      this.showDropdown = false;
      this.mobileSearchOpen.set(false);
      this.searchResults.set([]);
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchInput.trim() } 
      });
    }
  }

  logout() {
    this.authService.logout();
    this.mobileMenuOpen.set(false);
    this.router.navigate(['/']);
  }
}