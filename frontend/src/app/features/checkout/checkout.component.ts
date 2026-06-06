import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { ShippingService } from '../../core/services/shipping.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe, TranslatePipe],
  styles: [`
    .field-error { border-color: #ef4444 !important; }
    .error-msg { color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; }
    .step-active { background: #6366f1; color: white; }
    .step-done { background: #10b981; color: white; }
    .step-pending { background: #e2e8f0; color: #94a3b8; }
    .fade-in { animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .payment-icon-cash { background: #dcfce7; color: #16a34a; }
    .payment-icon-card { background: #dbeafe; color: #2563eb; }
    .payment-icon-d17 { background: #fef3c7; color: #d97706; }
  `],
  template: `
    <div class="container mx-auto px-4 py-6 sm:py-8 min-h-screen max-w-5xl">
      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-center gap-0 sm:gap-2">
          <!-- Step 1 -->
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                 [class]="step() >= 1 ? (step() > 1 ? 'step-done' : 'step-active') : 'step-pending'">
              @if (step() > 1) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              } @else { 1 }
            </div>
            <span class="ml-2 text-sm font-medium hidden sm:inline"
                  [class.text-primary-600]="step() === 1"
                  [class.text-emerald-600]="step() > 1"
                  [class.text-surface-400]="step() < 1">Livraison</span>
          </div>
          
          <div class="w-8 sm:w-16 h-0.5 mx-1 sm:mx-3" [class.bg-emerald-400]="step() > 1" [class.bg-surface-200]="step() <= 1"></div>
          
          <!-- Step 2 -->
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                 [class]="step() >= 2 ? (step() > 2 ? 'step-done' : 'step-active') : 'step-pending'">
              @if (step() > 2) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              } @else { 2 }
            </div>
            <span class="ml-2 text-sm font-medium hidden sm:inline"
                  [class.text-primary-600]="step() === 2"
                  [class.text-emerald-600]="step() > 2"
                  [class.text-surface-400]="step() < 2">Paiement</span>
          </div>
          
          <div class="w-8 sm:w-16 h-0.5 mx-1 sm:mx-3" [class.bg-emerald-400]="step() > 2" [class.bg-surface-200]="step() <= 2"></div>
          
          <!-- Step 3 -->
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                 [class]="step() >= 3 ? (step() > 3 ? 'step-done' : 'step-active') : 'step-pending'">
              3
            </div>
            <span class="ml-2 text-sm font-medium hidden sm:inline"
                  [class.text-primary-600]="step() === 3"
                  [class.text-surface-400]="step() < 3">Confirmer</span>
          </div>
        </div>
      </div>

      <div class="lg:grid lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- STEP 1: Delivery Address -->
          @if (step() === 1) {
            <div class="bg-white rounded-2xl shadow-sm p-5 sm:p-6 fade-in">
              <h2 class="text-lg font-bold mb-5 flex items-center gap-3 text-surface-800">
                <span class="w-8 h-8 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-sm font-bold">1</span>
                Adresse de livraison
              </h2>
              
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Nom complet *</label>
                  <input type="text" [(ngModel)]="shipping.fullName" name="fullName"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    [class.field-error]="touched['fullName'] && !shipping.fullName"
                    (blur)="touch('fullName')"
                    placeholder="Prénom et nom">
                  @if (touched['fullName'] && !shipping.fullName) {
                    <p class="error-msg">Ce champ est requis</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Téléphone *</label>
                  <input type="tel" [ngModel]="shipping.phone" (ngModelChange)="onPhoneInput($event)" name="phone"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    [class.field-error]="touched['phone'] && !isValidPhone()"
                    (blur)="touch('phone')"
                    placeholder="XX XXX XXX" maxlength="8">
                  @if (touched['phone'] && !isValidPhone()) {
                    <p class="error-msg">{{ shipping.phone.length > 0 ? 'Numéro invalide (8 chiffres requis)' : 'Ce champ est requis' }}</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Gouvernorat *</label>
                  <select [(ngModel)]="shipping.governorate" name="governorate"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                    [class.field-error]="touched['governorate'] && !shipping.governorate"
                    (change)="onGovernorateChange(); touch('governorate')">
                    <option value="">Sélectionner</option>
                    @for (gov of governorates; track gov) {
                      <option [value]="gov">{{ gov }}</option>
                    }
                  </select>
                  @if (touched['governorate'] && !shipping.governorate) {
                    <p class="error-msg">Ce champ est requis</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Ville *</label>
                  <input type="text" [(ngModel)]="shipping.city" name="city"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    [class.field-error]="touched['city'] && !shipping.city"
                    (blur)="touch('city')"
                    placeholder="Ville">
                  @if (touched['city'] && !shipping.city) {
                    <p class="error-msg">Ce champ est requis</p>
                  }
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Adresse complète *</label>
                  <input type="text" [(ngModel)]="shipping.streetAddress" name="streetAddress"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    [class.field-error]="touched['streetAddress'] && !shipping.streetAddress"
                    (blur)="touch('streetAddress')"
                    placeholder="Rue, immeuble, appartement">
                  @if (touched['streetAddress'] && !shipping.streetAddress) {
                    <p class="error-msg">Ce champ est requis</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Code postal</label>
                  <input type="text" [(ngModel)]="shipping.postalCode" name="postalCode"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Optionnel">
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-surface-700 mb-1.5">Instructions de livraison</label>
                  <textarea [(ngModel)]="shipping.additionalInfo" name="additionalInfo" rows="2"
                    class="w-full border rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    placeholder="Digicode, étage, etc."></textarea>
                </div>
              </div>

              <button (click)="goToStep2()" 
                [disabled]="!isStep1Valid()"
                class="w-full mt-6 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition disabled:bg-surface-300 disabled:cursor-not-allowed cursor-pointer">
                Continuer vers le paiement
              </button>
            </div>
          }

          <!-- STEP 2: Payment Method -->
          @if (step() === 2) {
            <div class="bg-white rounded-2xl shadow-sm p-5 sm:p-6 fade-in">
              <h2 class="text-lg font-bold mb-5 flex items-center gap-3 text-surface-800">
                <span class="w-8 h-8 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-sm font-bold">2</span>
                Mode de paiement
              </h2>
              
              <div class="space-y-3">
                @for (method of paymentMethods; track method.value) {
                  <label 
                    class="border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 hover:border-primary-300"
                    [class.border-primary-500]="paymentMethod === method.value"
                    [class.bg-primary-50]="paymentMethod === method.value">
                    <input type="radio" name="payment" [value]="method.value" [(ngModel)]="paymentMethod" class="text-primary-600 focus:ring-primary-500">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" [class]="method.iconClass">
                      <span class="text-lg" [innerHTML]="method.icon"></span>
                    </div>
                    <div>
                      <div class="font-semibold text-surface-800">{{ method.label }}</div>
                      <div class="text-xs text-surface-500">{{ method.desc }}</div>
                    </div>
                  </label>
                }
              </div>

              <div class="flex gap-3 mt-6">
                <button (click)="step.set(1)" class="px-6 py-3 border-2 border-surface-200 rounded-xl font-medium hover:bg-surface-50 transition cursor-pointer">
                  Retour
                </button>
                <button (click)="goToStep3()" 
                  class="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition cursor-pointer">
                  Vérifier la commande
                </button>
              </div>
            </div>
          }

          <!-- STEP 3: Confirmation -->
          @if (step() === 3) {
            <div class="bg-white rounded-2xl shadow-sm p-5 sm:p-6 fade-in">
              <h2 class="text-lg font-bold mb-5 flex items-center gap-3 text-surface-800">
                <span class="w-8 h-8 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-sm font-bold">3</span>
                Récapitulatif de la commande
              </h2>

              <!-- Address Summary -->
              <div class="bg-surface-50 rounded-xl p-4 mb-4">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-sm text-surface-500 mb-1">Adresse de livraison</p>
                    <p class="font-semibold text-surface-800">{{ shipping.fullName }}</p>
                    <p class="text-sm text-surface-600">{{ shipping.streetAddress }}, {{ shipping.city }} - {{ shipping.governorate }}</p>
                    <p class="text-sm text-surface-600">{{ formatPhoneDisplay(shipping.phone) }}</p>
                  </div>
                  <button (click)="step.set(1)" class="text-primary-600 hover:text-primary-700 text-sm font-medium cursor-pointer">Modifier</button>
                </div>
              </div>

              <!-- Payment Summary -->
              <div class="bg-surface-50 rounded-xl p-4 mb-4">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-sm text-surface-500 mb-1">Mode de paiement</p>
                    <p class="font-semibold text-surface-800">{{ getPaymentLabel() }}</p>
                  </div>
                  <button (click)="step.set(2)" class="text-primary-600 hover:text-primary-700 text-sm font-medium cursor-pointer">Modifier</button>
                </div>
              </div>

              <!-- Coupon -->
              <div class="bg-surface-50 rounded-xl p-4 mb-4">
                @if (couponApplied() && appliedCouponInfo()) {
                  <div class="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <span class="text-sm font-medium text-green-700">{{ appliedCouponInfo()?.code }}</span>
                      <span class="text-xs text-green-600 block">{{ appliedCouponInfo()?.label }}</span>
                    </div>
                    <button type="button" (click)="removeCoupon()" class="text-green-700 hover:text-green-900 cursor-pointer">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                } @else {
                  <p class="text-sm text-surface-500 mb-2">Code promo</p>
                  <div class="flex gap-2">
                    <input type="text" [(ngModel)]="couponCode" name="coupon"
                      placeholder="Entrez votre code"
                      class="flex-1 text-sm px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                    <button type="button" (click)="applyCoupon()"
                      [disabled]="!couponCode() || applyingCoupon()"
                      class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:bg-surface-300 disabled:cursor-not-allowed cursor-pointer">
                      @if (applyingCoupon()) { ... } @else { Appliquer }
                    </button>
                  </div>
                  @if (couponError()) {
                    <p class="text-xs text-red-500 mt-1">{{ couponError() }}</p>
                  }
                }
              </div>

              <!-- Items List -->
              <div class="space-y-3 mb-4">
                @for (item of cartItems(); track item._id) {
                  <div class="flex gap-3">
                    <img [src]="item.product.media.images[0] | imageUrl" class="w-14 h-14 object-contain bg-surface-100 rounded-lg" width="56" height="56">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate text-surface-800">{{ item.product.name }}</p>
                      <p class="text-xs text-surface-500">Qté: {{ item.quantity }}</p>
                    </div>
                    <p class="text-sm font-bold text-primary-600 whitespace-nowrap">{{ item.product.pricing.price * item.quantity | number:'1.2-2' }} DT</p>
                  </div>
                }
              </div>

              <div class="flex gap-3 mt-6">
                <button (click)="step.set(2)" class="px-6 py-3 border-2 border-surface-200 rounded-xl font-medium hover:bg-surface-50 transition cursor-pointer">
                  Retour
                </button>
                <button (click)="placeOrder()"
                  [disabled]="placingOrder()"
                  class="flex-1 bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition disabled:bg-surface-300 disabled:cursor-not-allowed cursor-pointer">
                  @if (placingOrder()) { Traitement en cours... } @else { Confirmer la commande }
                </button>
              </div>

              <p class="text-xs text-surface-400 text-center mt-3">
                En confirmant, vous acceptez nos conditions générales de vente
              </p>
            </div>
          }

          <!-- Trust Badges (shown on all steps) -->
          <div class="bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="text-center p-3">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h3 class="font-semibold text-surface-800 text-xs">Paiement sécurisé</h3>
              </div>
              <div class="text-center p-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </div>
                <h3 class="font-semibold text-surface-800 text-xs">Retours gratuits</h3>
              </div>
              <div class="text-center p-3">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 class="font-semibold text-surface-800 text-xs">Livraison 24-48h</h3>
              </div>
              <div class="text-center p-3">
                <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <h3 class="font-semibold text-surface-800 text-xs">Support 7j/7</h3>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
            <h2 class="text-lg font-bold mb-4 text-surface-800">Récapitulatif</h2>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-surface-600">
                <span>Sous-total</span>
                <span class="font-medium text-surface-800">{{ subtotal() | number:'1.2-2' }} DT</span>
              </div>
              <div class="flex justify-between text-surface-600">
                <span>Livraison</span>
                <span class="font-medium text-surface-800">{{ shippingCost() === 0 ? 'Gratuite' : (shippingCost() | number:'1.2-2') + ' DT' }}</span>
              </div>
              
              @if (discount() > 0) {
                <div class="flex justify-between text-green-600">
                  <span>Réduction (-)</span>
                  <span class="font-medium">-{{ discount() | number:'1.2-2' }} DT</span>
                </div>
              }

              <div class="border-t border-surface-200 pt-2 mt-2"></div>
              
              <div class="flex justify-between text-surface-600">
                <span>HT</span>
                <span>{{ ht() | number:'1.2-2' }} DT</span>
              </div>
              <div class="flex justify-between text-surface-600">
                <span>TVA (19%)</span>
                <span>{{ tva() | number:'1.2-2' }} DT</span>
              </div>
              @if (timbre() > 0) {
                <div class="flex justify-between text-surface-600">
                  <span>Timbre</span>
                  <span>{{ timbre() | number:'1.2-2' }} DT</span>
                </div>
              }
              
              <div class="border-t border-surface-200 pt-2 flex justify-between text-lg font-bold">
                <span class="text-surface-900">Total</span>
                <span class="text-primary-600">{{ ttc() | number:'1.2-2' }} DT</span>
              </div>
            </div>

            @if (shippingCost() === 0 && subtotal() < 200) {
              <p class="text-xs text-green-600 bg-green-50 rounded-lg p-2 mt-3 text-center">
                Livraison gratuite appliquée
              </p>
            }
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

  step = signal(1);
  cartItems = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;
  
  shippingCost = computed(() => {
    if (this.appliedCouponInfo()?.type === 'FREE_SHIPPING') return 0;
    if (this.subtotal() >= 200) return 0;
    return this.shippingCostValue();
  });

  shippingCostValue = signal(7);

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

  touched: Record<string, boolean> = {};

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
    { value: 'CASH_ON_DELIVERY', label: 'Paiement à la livraison', desc: 'Payez en espèces à la réception', iconClass: 'payment-icon-cash', icon: '💵' },
    { value: 'CARD_ONLINE', label: 'Carte bancaire', desc: 'Visa, Mastercard, Konnect', iconClass: 'payment-icon-card', icon: '💳' },
    { value: 'D17', label: 'D17', desc: 'Payez en 17 fois sans frais', iconClass: 'payment-icon-d17', icon: '📱' }
  ];

  governorates = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Beja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabes', 'Medenine', 'Tataouine',
    'Gafsa', 'Tozeur', 'Kebili'
  ];

  private governorateCityMap: Record<string, string> = {
    'Tunis': 'Tunis', 'Ariana': 'Ariana', 'Ben Arous': 'Ben Arous', 'Manouba': 'Manouba',
    'Nabeul': 'Nabeul', 'Zaghouan': 'Zaghouan', 'Bizerte': 'Bizerte', 'Beja': 'Beja',
    'Jendouba': 'Jendouba', 'Kef': 'Le Kef', 'Siliana': 'Siliana', 'Sousse': 'Sousse',
    'Monastir': 'Monastir', 'Mahdia': 'Mahdia', 'Kairouan': 'Kairouan', 'Kasserine': 'Kasserine',
    'Sidi Bouzid': 'Sidi Bouzid', 'Gabes': 'Gabes', 'Medenine': 'Medenine', 'Tataouine': 'Tataouine',
    'Gafsa': 'Gafsa', 'Tozeur': 'Tozeur', 'Kebili': 'Kebili'
  };

  ngOnInit() {}

  touch(field: string) {
    this.touched[field] = true;
  }

  onPhoneInput(value: string) {
    const digits = value.replace(/\D/g, '').substring(0, 8);
    this.shipping.phone = digits;
  }

  formatPhoneDisplay(phone: string): string {
    if (!phone) return '';
    const d = phone.replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.substring(0, 2) + ' ' + d.substring(2);
    return d.substring(0, 2) + ' ' + d.substring(2, 5) + ' ' + d.substring(5);
  }

  isValidPhone(): boolean {
    return /^\d{8}$/.test(this.shipping.phone);
  }

  isStep1Valid(): boolean {
    return !!(
      this.shipping.fullName &&
      this.shipping.phone &&
      this.isValidPhone() &&
      this.shipping.governorate &&
      this.shipping.city &&
      this.shipping.streetAddress
    );
  }

  goToStep2() {
    this.touched = { fullName: true, phone: true, governorate: true, city: true, streetAddress: true };
    if (this.isStep1Valid()) {
      this.step.set(2);
    }
  }

  goToStep3() {
    this.step.set(3);
  }

  getPaymentLabel(): string {
    const labels: Record<string, string> = {
      'CASH_ON_DELIVERY': '💵 Paiement à la livraison',
      'CARD_ONLINE': '💳 Carte bancaire',
      'D17': '📱 D17'
    };
    return labels[this.paymentMethod] || this.paymentMethod;
  }

  async onGovernorateChange() {
    if (!this.shipping.governorate) {
      this.shippingCostValue.set(7);
      return;
    }
    if (!this.shipping.city) {
      this.shipping.city = this.governorateCityMap[this.shipping.governorate] || '';
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
            this.appliedCouponInfo.set({ code: coupon.code, type: coupon.type, discount: discountValue, label });
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
        complete: () => { this.applyingCoupon.set(false); }
      });
  }

  async placeOrder() {
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
}
