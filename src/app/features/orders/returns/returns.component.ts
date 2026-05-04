import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReturnService, ReturnRequest } from '../../../core/services/return.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent],
  template: `
    <div class="container mx-auto px-4 py-8 min-h-screen">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Mes retours</h1>
        <button (click)="showForm.set(true)" class="btn-primary">
          Demander un retour
        </button>
      </div>

      @if (loading()) {
        <app-skeleton type="table" [count]="3"/>
      } @else if (returns().length === 0) {
        <div class="bg-white rounded-xl shadow-sm p-16 text-center">
          <p class="text-gray-500 text-lg mb-4">Vous n'avez pas de demande de retour</p>
          <button (click)="showForm.set(true)" class="btn-primary inline-block">
            Demander un retour
          </button>
        </div>
      } @else {
        <div class="space-y-4">
          @for (ret of returns(); track ret._id) {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <span class="text-sm text-gray-500">Commande</span>
                  <p class="font-bold text-lg">{{ ret.order?.orderNumber }}</p>
                </div>
                <span 
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  [class]="getStatusClass(ret.status)"
                >
                  {{ getStatusLabel(ret.status) }}
                </span>
              </div>

              <div class="grid md:grid-cols-3 gap-4 text-sm border-t pt-4">
                <div>
                  <span class="text-gray-500">Type</span>
                  <p class="font-medium">{{ ret.type === 'RETURN' ? 'Retour produit' : 'Remboursement' }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Motif</span>
                  <p class="font-medium">{{ getReasonLabel(ret.reason) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Montant</span>
                  <p class="font-bold text-primary-600">{{ ret.refundAmount | number:'1.3' }} DT</p>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">Demander un retour</h3>
              <button (click)="showForm.set(false)" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Commande</label>
                <select [(ngModel)]="formData.orderId" class="input-field">
                  <option value="">Sélectionner une commande</option>
                  @for (order of orders(); track order._id) {
                    <option [value]="order._id">{{ order.orderNumber }} - {{ order.pricing.total | number:'1.3' }} DT</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select [(ngModel)]="formData.type" class="input-field">
                  <option value="RETURN">Retour produit</option>
                  <option value="REFUND">Remboursement</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <select [(ngModel)]="formData.reason" class="input-field">
                  <option value="DEFECTIVE_PRODUCT">Produit défectueux</option>
                  <option value="WRONG_ITEM">Mauvais article reçu</option>
                  <option value="NOT_AS_DESCRIBED">Non conforme à la description</option>
                  <option value="CHANGED_MIND">J'ai changé d'avis</option>
                  <option value="SIZE_ISSUE">Problème de taille</option>
                  <option value="QUALITY_ISSUE"> Qualité décevante</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  [(ngModel)]="formData.description" 
                  rows="4" 
                  class="input-field" 
                  placeholder="Décrivez votre problème..."
                ></textarea>
              </div>

              <button 
                (click)="submitReturn()" 
                [disabled]="submitting() || !formData.orderId || !formData.description"
                class="w-full btn-primary"
              >
                @if (submitting()) {
                  Envoi en cours...
                } @else {
                  Soumettre la demande
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ReturnsComponent implements OnInit {
  private returnService = inject(ReturnService);
  private orderService = inject(OrderService);
  private toast = inject(ToastService);
  private router = inject(Router);

  returns = signal<ReturnRequest[]>([]);
  orders = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  submitting = signal(false);

  formData = {
    orderId: '',
    type: 'RETURN' as 'RETURN' | 'REFUND',
    reason: 'DEFECTIVE_PRODUCT',
    description: ''
  };

  ngOnInit() {
    this.loadReturns();
    this.loadOrders();
  }

  loadReturns() {
    this.returnService.getMyReturns().subscribe({
      next: (res) => {
        this.returns.set(res.returns);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadOrders() {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders.filter((o: any) => o.status === 'DELIVERED'));
      }
    });
  }

  submitReturn() {
    this.submitting.set(true);
    const order = this.orders().find(o => o._id === this.formData.orderId);
    const email = order?.guestEmail || order?.user?.email;
    
    this.returnService.createReturn({
      orderId: this.formData.orderId,
      items: [],
      type: this.formData.type,
      reason: this.formData.reason,
      description: this.formData.description,
      email: email
    }).subscribe({
      next: (res) => {
        this.toast.success('Succès', res.message);
        this.showForm.set(false);
        this.loadReturns();
        this.formData = { orderId: '', type: 'RETURN', reason: 'DEFECTIVE_PRODUCT', description: '' };
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Erreur');
      },
      complete: () => this.submitting.set(false)
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'RECEIVED': 'bg-purple-100 text-purple-800',
      'REFUNDED': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Rejeté',
      'RECEIVED': 'Reçu',
      'REFUNDED': 'Remboursé'
    };
    return labels[status] || status;
  }

  getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      'DEFECTIVE_PRODUCT': 'Produit défectueux',
      'WRONG_ITEM': 'Mauvais article',
      'NOT_AS_DESCRIBED': 'Non conforme',
      'CHANGED_MIND': 'Changement d\'avis',
      'SIZE_ISSUE': 'Taille',
      'QUALITY_ISSUE': 'Qualité',
      'OTHER': 'Autre'
    };
    return labels[reason] || reason;
  }
}