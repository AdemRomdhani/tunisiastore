import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CompareService } from '../../../core/services/compare.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Mobile Search Bar -->
    <div class="lg:hidden bg-white border-b border-surface-100 px-4 py-3">
      <div class="relative">
        <input 
          type="text" 
          [(ngModel)]="searchInput"
          (keyup.enter)="doSearch()"
          placeholder="Rechercher..."
          class="w-full pl-10 pr-12 py-2.5 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        >
        <button (click)="doSearch()" class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-surface-400 hover:text-primary-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>

    <nav class="bg-white shadow-card sticky top-0 z-50">
    <nav class="bg-white shadow-card sticky top-0 z-50">
      <!-- Top bar -->
      <div class="bg-primary-700 text-white text-sm">
        <div class="container mx-auto px-4 py-2 flex justify-between items-center">
          <div class="flex items-center gap-6">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span class="hidden sm:inline">+216 55226228</span>
            </span>
            <span class="hidden sm:inline text-primary-200">•</span>
            <span class="hidden sm:inline">Livraison gratuite dès 200 DT</span>
          </div>
          <div class="flex items-center gap-5">
            @if (authService.isAuthenticated()) {
              <a routerLink="/profile" class="hover:text-primary-200 flex items-center gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span class="hidden lg:inline">Mon compte</span>
              </a>
              <a routerLink="/wishlist" class="hover:text-primary-200 flex items-center gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                <span class="hidden lg:inline">Favoris</span>
              </a>
              <button (click)="logout()" class="hover:text-primary-200 transition-colors">Déconnexion</button>
            } @else {
              <a routerLink="/login" class="hover:text-primary-200 transition-colors">Connexion</a>
              <a routerLink="/register" class="hover:text-primary-200 transition-colors">S'inscrire</a>
            }
            @if (authService.isAdmin() || authService.isSupervisor()) {
              <a routerLink="/admin" class="hover:text-primary-200 font-semibold transition-colors">Admin</a>
            }
          </div>
        </div>
      </div>

      <!-- Main navbar -->
      <div class="container mx-auto px-4 py-3 lg:py-4">
        <div class="flex items-center justify-between gap-4 lg:gap-8">
          <!-- Logo + Mobile Menu Button -->
          <div class="flex items-center gap-2">
            <button 
              type="button"
              class="lg:hidden p-2 -ml-2 text-surface-600 hover:text-surface-900"
              (click)="toggleMobileMenu()"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <a routerLink="/" class="flex items-center gap-2 lg:gap-3 group">
              <div class="w-9 h-9 lg:w-11 lg:h-11 bg-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span class="text-white font-bold text-lg lg:text-xl">TS</span>
              </div>
              <span class="text-lg lg:text-xl font-bold text-surface-900 hidden sm:block">Tunisia Store</span>
            </a>
          </div>

          <!-- Search -->
          <div class="flex-1 max-w-2xl hidden md:block">
            <div class="relative">
              <input 
                type="text" 
                [(ngModel)]="searchInput"
                (keyup.enter)="doSearch()"
                placeholder="Rechercher un produit..."
                class="w-full pl-5 pr-14 py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              >
              <button (click)="doSearch()" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-surface-400 hover:text-primary-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <a routerLink="/compare" class="relative p-2.5 hover:bg-surface-100 rounded-xl transition-colors">
              <svg class="w-6 h-6 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              @if (compareService.count() > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {{ compareService.count() }}
                </span>
              }
            </a>
            <a routerLink="/cart" class="relative p-2.5 hover:bg-surface-100 rounded-xl transition-colors">
              <svg class="w-6 h-6 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              @if (cartCount() > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {{ cartCount() }}
                </span>
              }
            </a>
          </div>
        </div>
      </div>

      <!-- Categories bar -->
      <div class="border-t border-surface-100">
        <div class="container mx-auto px-4">
          <!-- Desktop Categories -->
          <div class="hidden lg:flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
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
          
          <!-- Mobile Categories (Collapsible) -->
          @if (mobileMenuOpen()) {
            <div class="lg:hidden py-3 space-y-2 animate-fade-in">
              <div class="text-xs font-semibold text-surface-400 uppercase mb-2">Catégories</div>
              <div class="flex flex-wrap gap-2">
                @for (cat of categories(); track cat._id) {
                  <a 
                    [routerLink]="['/products']" 
                    [queryParams]="{category: cat.slug}"
                    (click)="mobileMenuOpen.set(false)"
                    class="px-3 py-2 text-sm font-medium text-surface-600 bg-surface-50 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                  >
                    {{ cat.name }}
                  </a>
                }
              </div>
              
              <!-- Mobile User Menu -->
              <div class="border-t border-surface-100 mt-4 pt-4">
                @if (authService.isAuthenticated()) {
                  <div class="flex flex-col gap-2">
                    <a routerLink="/profile" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2 text-surface-700 hover:bg-surface-50 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      Mon compte
                    </a>
                    <a routerLink="/wishlist" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2 text-surface-700 hover:bg-surface-50 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                      Favoris
                    </a>
                    <button (click)="logout(); mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-left">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Déconnexion
                    </button>
                  </div>
                } @else {
                  <div class="flex flex-col gap-2">
                    <a routerLink="/login" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2 text-surface-700 hover:bg-surface-50 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                      Connexion
                    </a>
                    <a routerLink="/register" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2 text-surface-700 hover:bg-surface-50 rounded-lg">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                      S'inscrire
                    </a>
                  </div>
                }
                @if (authService.isAdmin() || authService.isSupervisor()) {
                  <a routerLink="/admin" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-3 px-3 py-2 text-primary-600 font-semibold hover:bg-primary-50 rounded-lg mt-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Admin Panel
                  </a>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  private cartService = inject(CartService);
  compareService = inject(CompareService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  searchInput = '';
  mobileMenuOpen = signal(false);

  cartCount = this.cartService.itemCount;

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => this.categories.set(res.categories)
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  doSearch() {
    if (this.searchInput.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchInput.trim() } 
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}