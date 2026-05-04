import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/cart.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe, EmptyStateComponent],
  template: `
    <div class="container mx-auto px-4 py-8 min-h-screen">
      <h1 class="text-3xl font-bold text-surface-900 mb-8">Mon panier</h1>

      @if (cartItems().length === 0) {
        <div class="bg-surface-50 rounded-2xl shadow-card p-16 text-center animate-fade-in">
          <app-empty-state
            title="Votre panier est vide"
            description="Votre panier est vide. Ajoutez des produits pour continuer vos achats!"
            icon="cart"
            link="/products"
          />
        </div>
      } @else {
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Cart Items -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cartItems(); track item._id) {
              <div class="bg-surface-50 rounded-2xl shadow-card p-5 flex gap-5 animate-fade-in">
                <img 
                  [src]="item.product.media.images[0] | imageUrl" 
                  [alt]="item.product.name"
                  class="w-24 h-24 object-contain bg-surface-100 rounded-xl"
                  width="96" height="96"
                >
                
                <div class="flex-1">
                  <a [routerLink]="['/product', item.product.slug]" class="font-semibold text-surface-800 hover:text-primary-600 transition-colors">
                    {{ item.product.name }}
                  </a>
                  
                  <div class="text-primary-600 font-bold text-lg mt-1">
                    {{ item.product.pricing.price | number:'1.3-3' }} DT
                  </div>
                  
                  <div class="flex items-center gap-4 mt-4">
                    <div class="flex items-center border border-surface-200 rounded-xl">
                      <button (click)="decreaseQty(item)" class="w-10 h-10 flex items-center justify-center hover:bg-surface-100 transition-colors rounded-l-xl">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                        </svg>
                      </button>
                      <span class="w-12 text-center font-medium">{{ item.quantity }}</span>
                      <button (click)="increaseQty(item)" class="w-10 h-10 flex items-center justify-center hover:bg-surface-100 transition-colors rounded-r-xl">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                      </button>
                    </div>
                    
                    <button (click)="removeItem(item)" class="text-red-500 text-sm hover:text-red-600 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
          
          <!-- Summary -->
          <div class="lg:col-span-1">
            <div class="bg-surface-50 rounded-2xl shadow-card p-6 sticky top-24">
              <h2 class="text-lg font-bold mb-5 text-surface-800">Récapitulatif</h2>
              
              <div class="space-y-4 text-sm">
                <div class="flex justify-between">
                  <span class="text-surface-600">Sous-total</span>
                  <span class="font-medium text-surface-800">{{ subtotal() | number:'1.3-3' }} DT</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-surface-600">Livraison</span>
                  <span class="font-medium text-surface-800">{{ shippingCost() === 0 ? 'gratuite' : (shippingCost() | number:'1.3-3') + ' DT' }}</span>
                </div>

                @if (shippingCost() > 0) {
                  <p class="text-xs text-surface-500">Livraison gratuite dès 200 DT</p>
                }
                
                <div class="border-t border-surface-200 pt-4 flex justify-between text-xl font-bold">
                  <span class="text-surface-900">Total</span>
                  <span class="text-primary-600">{{ total() | number:'1.3-3' }} DT</span>
                </div>
              </div>
              
              <button (click)="goToCheckout()" class="btn-primary w-full mt-6">
                Passer la commande
              </button>
              
              <div class="mt-4 text-center">
                <a routerLink="/products" class="text-sm text-surface-500 hover:text-primary-600 transition-colors">
                  Continuer les achats
                </a>
              </div>

              <!-- Trust badges -->
              <div class="mt-6 pt-6 border-t border-surface-200">
                <div class="flex items-center justify-center gap-4 text-surface-400">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p class="text-xs text-surface-400 text-center mt-2">Paiement sécurisé • Livraison rapide • Support 7j/7</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  private cartService = inject(CartService);
  private router = inject(Router);

  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;
  shippingCost = this.cartService.shippingCost;
  total = this.cartService.total;

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item._id, item.quantity - 1).subscribe();
    }
  }

  increaseQty(item: CartItem) {
    this.cartService.updateQuantity(item._id, item.quantity + 1).subscribe();
  }

  removeItem(item: CartItem) {
    this.cartService.removeItem(item._id).subscribe({
      error: (err) => console.error('Failed to remove item:', err)
    });
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }
}