import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { ShippingService } from '../../core/services/shipping.service';
import { I18nService } from '../../core/services/i18n.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-8 min-h-screen">
      <h1 class="text-3xl font-bold text-surface-900 mb-8">{{ 'checkout.title' | t }}</h1>

      <div class="lg:grid lg:grid-cols-3 gap-8">
        <!-- Checkout Form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Shipping Address -->
          <div class="bg-surface-50 rounded-2xl shadow-card p-6">
            <h2 class="text-lg font-bold mb-5 flex items-center gap-3 text-surface-800">
              <span class="w-8 h-8 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-sm font-bold">1</span>
              {{ 'checkout.deliveryAddress' | t }}
            </h2>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Nom complet</label>
                <input type="text" [(ngModel)]="shipping.fullName" name="fullName" class="input-field" placeholder="Prénom et nom">
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Téléphone</label>
                <input type="tel" [(ngModel)]="shipping.phone" name="phone" class="input-field" placeholder="XX XXX XXX">
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Gouvernorat</label>
                <select [(ngModel)]="shipping.governorate" name="governorate" class="input-field" (change)="onGovernorateChange()">
                  <option value="">Sélectionner</option>
                  @for (gov of governorates; track gov) {
                    <option [value]="gov">{{ gov }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-2">Ville</label>
                <input type="text" [(ngModel)]="shipping.city" name="city" class="input-field" placeholder="Ville">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" [(ngModel)]="shipping.streetAddress" name="streetAddress" class="input-field" placeholder="Rue, immeuble, appartement">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Code postal (optionnel)</label>
                <input type="text" [(ngModel)]="shipping.postalCode" name="postalCode" class="input-field">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Instructions de livraison (optionnel)</label>
                <textarea [(ngModel)]="shipping.additionalInfo" name="additionalInfo" rows="2" class="input-field" placeholder="Digicode, étage, etc."></textarea>
              </div>
            </div>
          </div>

         
          <!-- Payment Method -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <span class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Mode de paiement
            </h2>
            
            <div class="grid sm:grid-cols-2 gap-4">
              @for (method of paymentMethods; track method.value) {
                <label 
                  class="border-2 rounded-xl p-4 cursor-pointer transition flex items-center gap-3"
                  [class.border-primary-500]="paymentMethod === method.value"
                  [class.bg-primary-50]="paymentMethod === method.value"
                >
                  <input 
                    type="radio" 
                    name="payment"
                    [value]="method.value"
                    [(ngModel)]="paymentMethod"
                    class="text-primary-600 focus:ring-primary-500"
                  >
                  <div>
                    <div class="font-medium">{{ method.label }}</div>
                    <div class="text-xs text-gray-500">{{ method.desc }}</div>
                  </div>
                </label>
              }
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900 text-sm">Paiement sécurisé</h3>
                <p class="text-xs text-gray-500 mt-1">SSL Crypté</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900 text-sm">Retours gratuits</h3>
                <p class="text-xs text-gray-500 mt-1">Sous 7 jours</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900 text-sm">Livraison rapide</h3>
                <p class="text-xs text-gray-500 mt-1">24-48h</p>
              </div>
              <div class="text-center p-4">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900 text-sm">Support 7j/7</h3>
                <p class="text-xs text-gray-500 mt-1">À votre service</p>
              </div>
            </div>
            
            <!-- Payment Icons -->
            <div class="mt-6 pt-4 border-t flex items-center justify-center gap-4 flex-wrap">
              <span class="text-xs text-gray-500">Paiement accepté:</span>
              <div class="flex items-center gap-2">
                <span class="bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600">Espèces</span>
                <span class="bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600">D17</span>
                <span class="bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600">Konnect</span>
                <span class="bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600">Visa</span>
                <span class="bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-600">MasterCard</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 class="text-lg font-bold mb-4">Récapitulatif</h2>
            
              <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
              @for (item of cartItems(); track item._id) {
                <div class="flex gap-3">
                  <img [src]="item.product.media.images[0] | imageUrl" class="w-16 h-16 object-contain bg-gray-50 rounded" width="64" height="64">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ item.product.name }}</p>
                    <p class="text-xs text-gray-500">Qté: {{ item.quantity }}</p>
                    <p class="text-sm font-bold text-primary-600">{{ item.product.pricing.price * item.quantity | number:'1.2-2' }} DT</p>
                  </div>
                </div>
              }
            </div>

            <div class="border-t pt-4 space-y-2 text-sm">
              <div class="flex justify-between text-gray-600">
                <span>Sous-total HT</span>
                <span>{{ subtotal() | number:'1.2-2' }} DT</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{{ shippingCost() === 0 ? 'gratuite' : (shippingCost() | number:'1.2-2') + ' DT' }}</span>
              </div>
              
              @if (discount() > 0) {
                <div class="flex justify-between text-green-600">
                  <span>Réduction (-)</span>
                  <span>-{{ discount() | number:'1.2-2' }} DT</span>
                </div>
              }

              <!-- Coupon Code -->
              <div class="border-t pt-3 mt-3">
                <label class="block text-xs font-medium text-gray-600 mb-1">Code promo</label>
                @if (couponApplied() && appliedCouponInfo()) {
                  <div class="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <span class="text-sm font-medium text-green-700">{{ appliedCouponInfo()?.code }}</span>
                      <span class="text-xs text-green-600 block">{{ appliedCouponInfo()?.label }}</span>
                    </div>
                    <button type="button" (click)="removeCoupon()" class="text-green-700 hover:text-green-900 text-sm">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                } @else {
                  <div class="flex gap-2">
                    <input 
                      type="text" 
                      [(ngModel)]="couponCode" 
                      name="coupon"
                      placeholder="Entrez votre code"
                      class="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                    <button 
                      type="button"
                      (click)="applyCoupon()"
                      [disabled]="!couponCode() || applyingCoupon()"
                      class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                    >
                      @if (applyingCoupon()) {
                        <span class="animate-pulse">...</span>
                      } @else {
                        Appliquer
                      }
                    </button>
                  </div>
                }
                @if (couponError()) {
                  <p class="text-xs text-red-500 mt-1">{{ couponError() }}</p>
                }
              </div>
              
              <div class="border-t pt-2 flex justify-between text-gray-600">
                <span>Montant HT</span>
                <span>{{ ht() | number:'1.2-2' }} DT</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>TVA (19%)</span>
                <span>{{ tva() | number:'1.2-2' }} DT</span>
              </div>
              @if (timbre() > 0) {
                <div class="flex justify-between text-gray-600">
                  <span>Timbre</span>
                  <span>{{ timbre() | number:'1.2-2' }} DT</span>
                </div>
              }
              
              <div class="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total TTC</span>
                <span class="text-primary-600">{{ ttc() | number:'1.2-2' }} DT</span>
              </div>
            </div>

            <button 
              type="button"
              (click)="placeOrder()"
              [disabled]="!isValid() || placingOrder()"
              class="w-full mt-6 bg-primary-600 text-white py-3.5 rounded-lg font-bold hover:bg-primary-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
            >
              @if (placingOrder()) {
                Traitement en cours...
              } @else {
                Confirmer la commande
              }
            </button>

            <p class="text-xs text-gray-500 text-center mt-4">
              En confirmant, vous acceptez nos conditions générales de vente
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private shippingService = inject(ShippingService);
  private http = inject(HttpClient);
  i18n = inject(I18nService);

  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;
  
  shippingCost = computed(() => {
    if (this.appliedCouponInfo()?.type === 'FREE_SHIPPING') return 0;
    if (this.subtotal() >= 200) return 0;
    return this.shippingCostValue();
  });

  shippingCostValue = signal(7);

  // Professional calculation:
  // Discount applies to products (subtotal) only — NOT to shipping
  // HT = (subtotal - discount) + shipping
  // TVA = 19% × HT
  // TTC = HT + TVA + timbre
  ht = computed(() => (this.subtotal() - this.discount()) + this.shippingCost());
  tva = computed(() => Math.round(this.ht() * 0.19 * 100) / 100);
  timbre = computed(() => this.paymentMethod === 'CASH_ON_DELIVERY' ? 1 : 0);
  ttc = computed(() => Math.round((this.ht() + this.tva() + this.timbre()) * 100) / 100);
  
  discount = signal(0);
  
  couponCode = signal('');
  couponError = signal('');
  couponApplied = signal(false);
  applyingCoupon = signal(false);
  appliedCouponInfo = signal<{code: string, type: string, discount: number, label: string} | null>(null);
  
  placingOrder = signal(false);
  selectedCarrier = 'poste';

  carriers = [
    { id: 'poste', name: 'Tunisia Post', price: 7 },
    { id: 'amena', name: 'Amena', price: 7 },
    { id: 'aramex', name: 'Aramex', price: 7 }
  ];

  shipping = {
    fullName: '',
    phone: '',
    governorate: '',
    city: '',
    streetAddress: '',
    postalCode: '',
    additionalInfo: ''
  };

  paymentMethod = 'CASH_ON_DELIVERY';
  paymentMethods = [
    { value: 'CASH_ON_DELIVERY', label: 'Paiement à la livraison', desc: 'Payez en espèces à la réception' },
    { value: 'CARD_ONLINE', label: 'Carte bancaire', desc: 'Paiement sécurisé par carte' },
    { value: 'D17', label: 'D17', desc: 'Paiement en 17 fois sans frais' }
  ];

  governorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Beja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabes', 'Medenine', 'Tataouine',
    'Gafsa', 'Tozeur', 'Kebili'
  ];

  ngOnInit() {}

  isValid(): boolean {
    return !!(
      this.shipping.fullName &&
      this.shipping.phone &&
      this.shipping.governorate &&
      this.shipping.city &&
      this.shipping.streetAddress
    );
  }

  async placeOrder() {
    if (!this.isValid()) return;
    
    this.placingOrder.set(true);
    
    try {
      const result = await this.orderService.createOrder({
        shippingAddress: this.shipping,
        paymentMethod: this.paymentMethod,
        notes: this.shipping.additionalInfo,
        couponCode: this.appliedCouponInfo()?.code || null
      }).toPromise();

      if (result?.success) {
        this.cartService.clearCart().subscribe();
        this.toast.success('Succès', 'Commande confirmée !');
        const orderNumber = result.order?.orderNumber || 'new';
        this.router.navigate(['/order/track'], { 
          queryParams: { orderNumber, phone: this.shipping.phone }
        });
      } else {
        this.toast.error('Erreur', (result as any)?.message || 'Erreur lors de la commande');
        this.placingOrder.set(false);
      }
    } catch (error: any) {
      const msg = error?.error?.message || error?.message || 'Erreur lors de la commande';
      this.toast.error('Erreur', msg);
      this.placingOrder.set(false);
    }
  }

  async onGovernorateChange() {
    if (!this.shipping.governorate) {
      this.shippingCostValue.set(7);
      return;
    }
    try {
      const result = await this.shippingService.getShippingCost(
        this.shipping.governorate, 
        this.selectedCarrier
      ).toPromise();
      if (result?.success) {
        this.shippingCostValue.set(result.cost?.total || 7);
      }
    } catch {
      this.shippingCostValue.set(7);
    }
  }

  async onCarrierChange() {
    await this.onGovernorateChange();
  }

  removeCoupon() {
    this.discount.set(0);
    this.couponCode.set('');
    this.couponApplied.set(false);
    this.appliedCouponInfo.set(null);
    this.couponError.set('');
  }

  applyCoupon() {
    const code = this.couponCode().trim().toUpperCase();
    if (!code) return;
    
    this.applyingCoupon.set(true);
    this.couponError.set('');
    
    this.http.post<any>(`${environment.apiUrl}/coupons/validate`, { code, subtotal: this.subtotal() })
      .subscribe({
        next: (res) => {
          if (res.success && res.coupon) {
            const coupon = res.coupon;
            
            let discountValue = 0;
            let label = '';
            
            if (coupon.type === 'PERCENTAGE') {
              discountValue = Math.round(this.subtotal() * (coupon.value / 100) * 1000) / 1000;
              label = `${coupon.value}% de réduction`;
            } else if (coupon.type === 'FIXED') {
              discountValue = coupon.value;
              label = `${coupon.value} DT de réduction`;
            } else if (coupon.type === 'FREE_SHIPPING') {
              discountValue = this.shippingCost();
              label = 'Livraison gratuite';
            }
            
            this.discount.set(discountValue);
            this.couponApplied.set(true);
            this.appliedCouponInfo.set({
              code: coupon.code,
              type: coupon.type,
              discount: discountValue,
              label: label
            });
            this.couponError.set('');
            this.toast.success('Code promo appliqué', `${label}!`);
          } else {
            this.couponError.set(res.message || 'Code promo invalide');
            this.couponApplied.set(false);
            this.appliedCouponInfo.set(null);
          }
        },
        error: (err) => {
          this.couponError.set(err.error?.message || 'Code promo invalide');
          this.couponApplied.set(false);
          this.appliedCouponInfo.set(null);
        },
        complete: () => {
          this.applyingCoupon.set(false);
        }
      });
  }
}