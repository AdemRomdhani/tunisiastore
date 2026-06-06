import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-8 min-h-screen">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">{{ 'orders.title' | t }}</h1>

      @if (successMessage()) {
        <div class="bg-green-100 border-2 border-green-400 text-green-800 p-6 rounded-xl mb-6 text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2 class="text-xl font-bold mb-1">{{ 'checkout.thankYou' | t }}</h2>
          <p class="text-lg">{{ successMessage() }}</p>
          <p class="text-sm mt-2 text-green-700">{{ 'orders.confirmationEmail' | t }}</p>
        </div>
      }

      @if (loading()) {
        <app-skeleton type="table" [count]="3"/>
      } @else if (orders().length === 0) {
        <div class="bg-white rounded-xl shadow-sm p-16 text-center">
          <p class="text-gray-500 text-lg mb-4">{{ 'orders.noOrdersText' | t }}</p>
          <a routerLink="/products" class="btn-primary inline-block">{{ 'orders.shopNow' | t }}</a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of orders(); track order._id) {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <span class="text-sm text-gray-500">{{ 'orders.order' | t }}</span>
                  <p class="font-bold text-lg">{{ order.orderNumber }}</p>
                </div>
                <div class="text-right">
                  <span 
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    [class]="getStatusClass(order.status)"
                  >
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
              </div>

              <div class="grid md:grid-cols-3 gap-4 text-sm border-t pt-4">
                <div>
                  <span class="text-gray-500">{{ 'orders.date' | t }}</span>
                  <p class="font-medium">{{ order.createdAt | date:'dd/MM/yyyy' }}</p>
                </div>
                <div>
                  <span class="text-gray-500">{{ 'orders.total' | t }}</span>
                  <p class="font-bold text-primary-600">{{ order.pricing.total | number:'1.3' }} DT</p>
                </div>
                <div>
                  <span class="text-gray-500">Paiement</span>
                  <p class="font-medium">{{ getPaymentMethod(order.payment.method) }}</p>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
                @if (order.shipping.trackingNumber) {
                  <div class="text-sm mr-auto">
                    <span class="text-gray-500">Suivi:</span>
                    <span class="font-mono font-medium ml-1">{{ order.shipping.trackingNumber }}</span>
                  </div>
                }
                @if (canCancel(order.status)) {
                  <button 
                    (click)="openCancelModal(order)"
                    class="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Annuler
                  </button>
                }
                <button 
                  (click)="downloadInvoice(order._id)"
                  class="text-surface-600 hover:text-primary-600 text-sm font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-50 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Facture
                </button>
                @if (order.status === 'DELIVERED') {
                  <button 
                    (click)="reorder(order)"
                    class="bg-primary-600 text-white text-sm font-medium flex items-center gap-1.5 px-4 py-1.5 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Commander à nouveau
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (showCancelModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 class="text-lg font-bold mb-4">Annuler la commande</h3>
            <p class="text-gray-600 mb-4">Êtes-vous sûr de vouloir annuler cette commande?</p>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Motif d'annulation (optionnel)</label>
              <textarea 
                [(ngModel)]="cancelReason" 
                rows="3" 
                class="input-field" 
                placeholder="Veuillez nous expliquer..."
              ></textarea>
            </div>

            <div class="flex gap-3">
              <button (click)="closeCancelModal()" class="btn-secondary flex-1">
                Non, maintenir
              </button>
              <button 
                (click)="confirmCancel()" 
                [disabled]="cancelling()"
                class="btn-primary flex-1 bg-red-600 hover:bg-red-700"
              >
                @if (cancelling()) {
                  Annulation...
                } @else {
                  Oui, annuler
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  successMessage = signal('');
  
  showCancelModal = signal(false);
  cancelling = signal(false);
  cancelReason = '';
  orderToCancel = signal<Order | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.successMessage.set(`Commande ${params['order']} confirmée avec succès !`);
        this.loadOrders();
      } else {
        this.loadOrders();
      }
    });
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  canCancel(status: string): boolean {
    return ['PENDING', 'CONFIRMED'].includes(status);
  }

  openCancelModal(order: Order) {
    this.orderToCancel.set(order);
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.cancelReason = '';
    this.orderToCancel.set(null);
  }

  confirmCancel() {
    const order = this.orderToCancel();
    if (!order) return;

    this.cancelling.set(true);
    this.orderService.cancelOrder(order._id, this.cancelReason).subscribe({
      next: (res) => {
        this.toast.success('Succès', res.message || 'Commande annulée');
        this.loadOrders();
        this.closeCancelModal();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Erreur lors de l\'annulation');
        this.cancelling.set(false);
      }
    });
  }

  downloadInvoice(orderId: string) {
    const token = localStorage.getItem('token');
    const url = `${environment.apiUrl}/payments/invoice/${orderId}`;
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch(err => {
      this.toast.error('Erreur', 'Impossible de télécharger la facture');
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'SHIPPED': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En préparation',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée'
    };
    return labels[status] || status;
  }

  getPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'CASH_ON_DELIVERY': 'Paiement à la livraison',
      'CARD_ONLINE': 'Carte bancaire',
      'D17': 'D17',
      'FLOUSSI': 'Floussi'
    };
    return methods[method] || method;
  }

  reorder(order: Order) {
    if (!order.items || order.items.length === 0) {
      this.toast.error('Erreur', 'Aucun produit dans cette commande');
      return;
    }
    this.orderService.reorder(order._id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Succès', `${order.items.length} produit(s) ajouté(s) au panier`);
          this.router.navigate(['/cart']);
        } else {
          this.toast.error('Erreur', res.message || 'Impossible de commander à nouveau');
        }
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Erreur lors de la commande à nouveau');
      }
    });
  }
}