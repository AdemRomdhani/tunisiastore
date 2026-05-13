import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { ReturnService } from '../../../core/services/return.service';
import { AddressService } from '../../../core/services/address.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">{{ 'nav.account' | t }}</h1>
      
      @if (!isVerified) {
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div class="flex-1">
              <p class="font-medium text-yellow-800">{{ 'profile.emailNotVerified' | t }}</p>
              <p class="text-sm text-yellow-700 mt-1">
                {{ 'profile.verifyEmailDesc' | t }}
              </p>
              <button (click)="resendVerification()" [disabled]="resending()" 
                      class="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900">
                @if (resending()) {
                  Envoi en cours...
                } @else {
                  Renvoyer l'email de vérification
                }
              </button>
            </div>
          </div>
        </div>
      }
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Sidebar -->
        <div class="space-y-2">
          <button (click)="activeTab.set('orders')" 
                  [class.bg-primary-600]="activeTab() === 'orders'"
                  [class.text-white]="activeTab() === 'orders'"
                  class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition">
            Mes commandes
          </button>
          <button (click)="activeTab.set('addresses')"
                  [class.bg-primary-600]="activeTab() === 'addresses'"
                  [class.text-white]="activeTab() === 'addresses'"
                  class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition">
            Mes adresses
          </button>
          <button (click)="activeTab.set('returns')"
                  [class.bg-primary-600]="activeTab() === 'returns'"
                  [class.text-white]="activeTab() === 'returns'"
                  class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition">
            Mes retours
          </button>
          <button (click)="activeTab.set('settings')"
                  [class.bg-primary-600]="activeTab() === 'settings'"
                  [class.text-white]="activeTab() === 'settings'"
                  class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition">
            Paramètres du compte
          </button>
          <button (click)="logout()" class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-red-600">
            Déconnexion
          </button>
        </div>

        <!-- Content -->
        <div class="md:col-span-2">
          @if (activeTab() === 'orders') {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold">Mes commandes</h2>
                <a routerLink="/orders" class="text-primary-600 text-sm hover:underline">Voir tout</a>
              </div>
              @if (orders().length === 0) {
                <p class="text-gray-500">Aucune commande</p>
              } @else {
                <div class="space-y-4">
                  @for (order of orders().slice(0, 3); track order._id) {
                    <div class="border rounded-lg p-4">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <span class="font-medium">#{{ order.orderNumber }}</span>
                          <span class="text-sm text-gray-500 ml-2">{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                          {{ order.status }}
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-bold">{{ order.pricing?.total | number:'1.3-3' }} DT</span>
                        <a [routerLink]="['/orders']" class="text-primary-600 hover:underline text-sm">Détails</a>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (activeTab() === 'addresses') {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold">Mes adresses</h2>
              </div>
              @if (addresses().length === 0) {
                <p class="text-gray-500 mb-4">Aucune adresse enregistrée</p>
                <a routerLink="/addresses" class="btn-primary inline-block">+ Ajouter une adresse</a>
              } @else {
                <div class="space-y-3">
                  @for (addr of addresses(); track addr._id) {
                    <div class="border rounded-lg p-4">
                      @if (addr.isDefault) {
                        <span class="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">Par défaut</span>
                      }
                      <p class="font-medium">{{ addr.fullName }}</p>
                      <p class="text-sm text-gray-600">{{ addr.streetAddress }}, {{ addr.city }}</p>
                      <p class="text-sm text-gray-500">{{ addr.phone }}</p>
                    </div>
                  }
                </div>
                <a routerLink="/addresses" class="block mt-4 text-primary-600 text-sm hover:underline">Gérer mes adresses</a>
              }
            </div>
          }

          @if (activeTab() === 'returns') {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold">Mes retours</h2>
              </div>
              @if (returns().length === 0) {
                <p class="text-gray-500 mb-4">Aucun retour</p>
                <a routerLink="/returns" class="btn-primary inline-block">Demander un retour</a>
              } @else {
                <div class="space-y-3">
                  @for (ret of returns(); track ret._id) {
                    <div class="border rounded-lg p-4">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <span class="font-medium">Commande #{{ ret.order?.orderNumber }}</span>
                          <p class="text-sm text-gray-600 mt-1">{{ ret.reason }}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-medium"
                              [class.bg-yellow-100]="ret.status === 'pending'"
                              [class.bg-green-100]="ret.status === 'approved'"
                              [class.bg-red-100]="ret.status === 'rejected'">
                          {{ ret.status }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-500">{{ ret.createdAt | date:'dd/MM/yyyy' }}</p>
                    </div>
                  }
                </div>
                <a routerLink="/returns" class="block mt-4 text-primary-600 text-sm hover:underline">Voir tous mes retours</a>
              }
            </div>
          }

          @if (activeTab() === 'settings') {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <h2 class="text-lg font-semibold mb-4">Paramètres du compte</h2>
              <form (ngSubmit)="updateProfile()" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input type="text" [(ngModel)]="profile.firstName" name="firstName" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input type="text" [(ngModel)]="profile.lastName" name="lastName" 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" [(ngModel)]="profile.email" name="email" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" [(ngModel)]="profile.phone" name="phone" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                </div>
                <button type="submit" class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
                  Enregistrer
                </button>
              </form>

              <hr class="my-6">

              <h3 class="font-medium mb-4">Changer le mot de passe</h3>
              <form (ngSubmit)="changePassword()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                  <input type="password" [(ngModel)]="passwords.current" name="currentPassword" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input type="password" [(ngModel)]="passwords.new" name="newPassword" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                  <input type="password" [(ngModel)]="passwords.confirm" name="confirmPassword" 
                         class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                </div>
                <button type="submit" class="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition">
                  Changer le mot de passe
                </button>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private returnService = inject(ReturnService);
  private addressService = inject(AddressService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  activeTab = signal<'orders' | 'settings' | 'addresses' | 'returns'>('orders');
  showTracking = signal<string | null>(null);
  orders = signal<any[]>([]);
  addresses = signal<any[]>([]);
  returns = signal<any[]>([]);
  resending = signal(false);
  
  profile = { firstName: '', lastName: '', email: '', phone: '' };
  passwords = { current: '', new: '', confirm: '' };

  get isVerified(): boolean {
    return this.authService.currentUser()?.isVerified ?? true;
  }

  resendVerification() {
    this.resending.set(true);
    const token = localStorage.getItem('token');
    this.http.post(`${this.apiUrl}/resend-verification`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res: any) => {
        this.toast.success('Email envoyé', res.message || 'Vérifiez votre boîte de réception');
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible d\'envoyer l\'email');
      },
      complete: () => this.resending.set(false)
    });
  }

  toggleOrderTracking(order: any) {
    this.showTracking.set(this.showTracking() === order._id ? null : order._id);
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    this.http.get<{ user: any }>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.authService.setAuth(token, res.user);
        this.profile = {
          firstName: res.user.firstName || '',
          lastName: res.user.lastName || '',
          email: res.user.email || '',
          phone: res.user.phone || ''
        };
      },
      error: () => {}
    });
    this.loadOrders();
    this.loadAddresses();
    this.loadReturns();
  }

  loadAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (res) => this.addresses.set(res.addresses || [])
    });
  }

  loadReturns() {
    this.returnService.getMyReturns().subscribe({
      next: (res) => this.returns.set(res.returns || [])
    });
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe({
      next: (res) => this.orders.set(res.orders || [])
    });
  }

  updateProfile() {
    this.toast.success('Succès', 'Profil mis à jour');
  }

  changePassword() {
    if (this.passwords.new !== this.passwords.confirm) {
      this.toast.error('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (this.passwords.new.length < 6) {
      this.toast.error('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    this.http.put<any>(`${this.apiUrl}/password`, {
      currentPassword: this.passwords.current,
      newPassword: this.passwords.new
    }).subscribe({
      next: () => {
        this.toast.success('Succès', 'Mot de passe changé. Veuillez vous reconnecter.');
        this.passwords = { current: '', new: '', confirm: '' };
        setTimeout(() => this.authService.logout(), 1500);
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Erreur lors du changement');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}