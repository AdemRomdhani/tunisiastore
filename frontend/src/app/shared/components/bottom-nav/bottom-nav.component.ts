import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 shadow-lg z-40 safe-area-pb">
      <div class="flex items-center justify-around py-2">
        <a 
          routerLink="/" 
          routerLinkActive="text-primary-600" 
          [routerLinkActiveOptions]="{exact: true}"
          class="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] text-surface-500 hover:text-primary-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span class="text-xs font-medium">{{ 'nav.home' | t }}</span>
        </a>

        <a 
          routerLink="/products" 
          routerLinkActive="text-primary-600"
          class="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] text-surface-500 hover:text-primary-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          <span class="text-xs font-medium">{{ 'nav.products' | t }}</span>
        </a>

        <a 
          routerLink="/cart" 
          routerLinkActive="text-primary-600"
          class="relative flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] text-surface-500 hover:text-primary-600 transition-colors"
        >
          <div class="relative">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            @if (cartCount() > 0) {
              <span class="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {{ cartCount() > 99 ? '99+' : cartCount() }}
              </span>
            }
          </div>
          <span class="text-xs font-medium">{{ 'nav.cart' | t }}</span>
        </a>

        <a 
          routerLink="/wishlist" 
          routerLinkActive="text-primary-600"
          class="relative flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] text-surface-500 hover:text-primary-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          @if (wishlistCount() > 0) {
            <span class="absolute top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {{ wishlistCount() }}
            </span>
          }
          <span class="text-xs font-medium">{{ 'nav.wishlist' | t }}</span>
        </a>

        <a 
          routerLink="/profile" 
          routerLinkActive="text-primary-600"
          class="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] text-surface-500 hover:text-primary-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span class="text-xs font-medium">{{ 'nav.account' | t }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }
    .safe-area-pb {
      padding-bottom: env(safe-area-inset-bottom, 0.5rem);
    }
  `]
})
export class BottomNavComponent {
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);

  cartCount = this.cartService.itemCount;
  wishlistCount = computed(() => this.wishlistService.wishlist()?.length || 0);
}