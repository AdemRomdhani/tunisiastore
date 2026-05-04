import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

interface ReturnRequest {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
    user?: { firstName: string; lastName: string; email: string };
    guestEmail?: string;
    pricing: { total: number };
  };
  user?: { _id: string; firstName: string; lastName: string; email: string };
  guestEmail?: string;
  items: Array<{
    name: string;
    image: string;
    quantity: number;
    price: number;
  }>;
  type: 'RETURN' | 'REFUND';
  reason: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  refundAmount: number;
  refundMethod?: string;
  adminNotes?: string;
  timeline: Array<{
    status: string;
    note: string;
    timestamp: Date;
  }>;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des retours</h1>
        <div class="flex gap-2">
          <select [(ngModel)]="statusFilter" (ngModelChange)="loadReturns()" class="input-field">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
            <option value="RECEIVED">Reçu</option>
            <option value="REFUNDED">Remboursé</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-xl shadow-sm p-6 animate-pulse h-32"></div>
          }
        </div>
      } @else if (returns().length === 0) {
        <div class="bg-white rounded-xl shadow-sm p-16 text-center">
          <p class="text-gray-500 text-lg">Aucun retour trouvé</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (ret of returns(); track ret._id) {
            <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span class="text-sm text-gray-500">Commande</span>
                  <p class="font-bold text-lg">{{ ret.order?.orderNumber }}</p>
                  <p class="text-sm text-gray-600">
                    @if (ret.user) {
                      {{ ret.user.firstName }} {{ ret.user.lastName }} ({{ ret.user.email }})
                    } @else {
                      {{ ret.guestEmail }}
                    }
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span 
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    [class]="getStatusClass(ret.status)"
                  >
                    {{ getStatusLabel(ret.status) }}
                  </span>
                  <button 
                    (click)="selectedReturn.set(ret)"
                    class="btn-secondary text-sm"
                  >
                    Gérer
                  </button>
                </div>
              </div>

              <div class="grid md:grid-cols-4 gap-4 text-sm border-t pt-4">
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
                <div>
                  <span class="text-gray-500">Date</span>
                  <p class="font-medium">{{ ret.createdAt | date:'dd/MM/yyyy' }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        @if (pagination().pages > 1) {
          <div class="flex justify-center gap-2 mt-6">
            <button 
              (click)="loadReturns(pagination().current - 1)"
              [disabled]="pagination().current === 1"
              class="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50"
            >
              Précédent
            </button>
            <span class="px-3 py-1">{{ pagination().current }} / {{ pagination().pages }}</span>
            <button 
              (click)="loadReturns(pagination().current + 1)"
              [disabled]="pagination().current === pagination().pages"
              class="px-3 py-1 rounded-lg bg-gray-100 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        }
      }
    </div>

    @if (selectedReturn()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">Gérer le retour</h3>
            <button (click)="selectedReturn.set(null)" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">Commande:</span>
                  <p class="font-medium">{{ selectedReturn()!.order?.orderNumber }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Montant:</span>
                  <p class="font-bold text-primary-600">{{ selectedReturn()!.refundAmount | number:'1.3' }} DT</p>
                </div>
                <div>
                  <span class="text-gray-500">Type:</span>
                  <p class="font-medium">{{ selectedReturn()!.type === 'RETURN' ? 'Retour produit' : 'Remboursement' }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Motif:</span>
                  <p class="font-medium">{{ getReasonLabel(selectedReturn()!.reason) }}</p>
                </div>
              </div>
              <div class="mt-3">
                <span class="text-gray-500">Description:</span>
                <p class="text-sm">{{ selectedReturn()!.description }}</p>
              </div>
            </div>

            @if (selectedReturn()!.items.length > 0) {
              <div>
                <h4 class="font-medium mb-2">Articles</h4>
                <div class="space-y-2">
                  @for (item of selectedReturn()!.items; track item.name) {
                    <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <img [src]="getImageUrl(item.image)" class="w-12 h-12 object-cover rounded">
                      <div class="flex-1">
                        <p class="font-medium">{{ item.name }}</p>
                        <p class="text-sm text-gray-500">Qty: {{ item.quantity }} × {{ item.price | number:'1.3' }} DT</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select [(ngModel)]="updateStatus" class="input-field">
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Approuver</option>
                <option value="REJECTED">Rejeter</option>
                <option value="RECEIVED">Marquer comme reçu</option>
                <option value="REFUNDED">Rembourser</option>
              </select>
            </div>

            @if (updateStatus === 'REFUNDED') {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Méthode de remboursement</label>
                <select [(ngModel)]="refundMethod" class="input-field">
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="STORE_CREDIT">Crédit boutique</option>
                  <option value="ORIGINAL_PAYMENT">Paiement original</option>
                </select>
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea 
                [(ngModel)]="adminNotes" 
                rows="3" 
                class="input-field" 
                placeholder="Ajouter des notes..."
              ></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button (click)="selectedReturn.set(null)" class="btn-secondary flex-1">Annuler</button>
              <button 
                (click)="updateReturn()" 
                [disabled]="updating()"
                class="btn-primary flex-1"
              >
                {{ updating() ? 'Enregistrement...' : 'Mettre à jour' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminReturnsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  returns = signal<ReturnRequest[]>([]);
  loading = signal(true);
  updating = signal(false);
  selectedReturn = signal<ReturnRequest | null>(null);
  
  statusFilter = '';
  updateStatus = '';
  adminNotes = '';
  refundMethod = 'BANK_TRANSFER';
  
  pagination = signal({ current: 1, pages: 1, total: 0 });

  ngOnInit() {
    this.loadReturns();
  }

  loadReturns(page = 1) {
    this.loading.set(true);
    const params: any = { page };
    if (this.statusFilter) params.status = this.statusFilter;

    this.adminService.getReturns(params).subscribe({
      next: (res) => {
        this.returns.set(res.returns);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  updateReturn() {
    const ret = this.selectedReturn();
    if (!ret) return;

    this.updating.set(true);
    this.adminService.updateReturn(ret._id, {
      status: this.updateStatus,
      adminNotes: this.adminNotes,
      refundMethod: this.updateStatus === 'REFUNDED' ? this.refundMethod : undefined
    }).subscribe({
      next: (res) => {
        this.toast.success('Succès', 'Retour mis à jour');
        this.loadReturns(this.pagination().current);
        this.selectedReturn.set(null);
        this.resetForm();
        this.updating.set(false);
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Erreur');
        this.updating.set(false);
      }
    });
  }

  resetForm() {
    this.updateStatus = '';
    this.adminNotes = '';
    this.refundMethod = 'BANK_TRANSFER';
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

  getImageUrl(path: string): string {
    if (!path) return 'https://placehold.co/48x48?text=?';
    if (path.startsWith('http')) return path;
    return `${this.adminService['apiUrl'].replace('/api', '')}${path}`;
  }
}