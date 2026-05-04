import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des coupons</h1>
        <button 
          (click)="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter un coupon
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-500">Chargement...</div>
        } @else if (coupons().length === 0) {
          <app-empty-state
            title="Aucun coupon"
            description="Commencez par créer votre premier coupon."
            icon="default"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valeur</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiration</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (coupon of coupons(); track coupon._id) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4">
                      <span class="font-mono font-bold text-indigo-600">{{ coupon.code }}</span>
                    </td>
                    <td class="px-6 py-4">
                      @switch (coupon.type) {
                        @case ('PERCENTAGE') { Pourcentage }
                        @case ('FIXED') { Montant fixe }
                        @case ('FREE_SHIPPING') { Livraison gratuite }
                        @default { {{ coupon.type }} }
                      }
                    </td>
                    <td class="px-6 py-4 font-medium text-gray-900">
                      @if (coupon.type === 'PERCENTAGE') {
                        {{ coupon.value }}%
                      } @else if (coupon.type === 'FIXED') {
                        {{ coupon.value | number:'1.3' }} DT
                      } @else {
                        -
                      }
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-gray-600">{{ coupon.usage?.usedCount || 0 }} / {{ coupon.usage?.maxUses || '∞' }}</span>
                    </td>
                    <td class="px-6 py-4">
                      @if (coupon.expiresAt) {
                        <span [class]="isExpired(coupon.expiresAt) ? 'text-red-600' : 'text-gray-600'">
                          {{ coupon.expiresAt | date:'dd/MM/yyyy' }}
                        </span>
                      } @else {
                        <span class="text-gray-400">Pas d'expiration</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      @if (coupon.isActive) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Actif
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Inactif
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="openModal(coupon)"
                          class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button
                          (click)="toggleStatus(coupon)"
                          class="p-2 rounded-lg transition"
                          [class.text-green-600]="!coupon.isActive"
                          [class.hover:bg-green-50]="!coupon.isActive"
                          [class.text-gray-400]="coupon.isActive"
                          [class.hover:bg-gray-100]="coupon.isActive"
                          [title]="coupon.isActive ? 'Désactiver' : 'Activer'"
                        >
                          @if (coupon.isActive) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          }
                        </button>
                        <button
                          (click)="confirmDelete(coupon)"
                          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [total]="pagination().total"
            [pageSize]="pageSize"
            (pageChange)="onPageChange($event)"
          />
        }
      </div>
    </div>

    <!-- Modal -->
    @if (modalOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="modalOpen = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCoupon ? 'Modifier le coupon' : 'Ajouter un coupon' }}</h3>
            <form (ngSubmit)="saveCoupon()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Code coupon *</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.code" 
                  name="code" 
                  required
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase"
                  placeholder="ex: PROMOWINTER"
                >
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select 
                    [(ngModel)]="formData.type" 
                    name="type" 
                    required
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED">Montant fixe</option>
                    <option value="FREE_SHIPPING">Livraison gratuite</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                  <input 
                    type="number" 
                    [(ngModel)]="formData.value" 
                    name="value" 
                    [disabled]="formData.type === 'FREE_SHIPPING'"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Utilisations max</label>
                  <input 
                    type="number" 
                    [(ngModel)]="formData.usage.maxUses" 
                    name="maxUses"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Illimité si vide"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                  <input 
                    type="date" 
                    [(ngModel)]="formData.expiresAt" 
                    name="expiresAt"
                    class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Commande min (DT)</label>
                <input 
                  type="number" 
                  [(ngModel)]="formData.minOrderAmount" 
                  name="minOrderAmount"
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  [(ngModel)]="formData.description" 
                  name="description"
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  [(ngModel)]="formData.isActive" 
                  name="isActive"
                  class="w-4 h-4 text-indigo-600 rounded border-gray-300"
                >
                <label class="text-sm text-gray-700">Coupon actif</label>
              </div>
            </form>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <button 
              (click)="modalOpen = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Annuler
            </button>
            <button 
              (click)="saveCoupon()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              {{ editingCoupon ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <app-confirm-dialog
      [isOpen]="confirmDialogOpen"
      [title]="dialogTitle"
      [message]="dialogMessage"
      [confirmText]="dialogConfirmText"
      [confirmClass]="dialogConfirmClass"
      (confirmed)="confirmAction()"
      (cancelled)="confirmDialogOpen = false"
    />
  `
})
export class AdminCouponsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  coupons = signal<any[]>([]);
  loading = signal(false);
  modalOpen = false;
  editingCoupon: any = null;

  currentPage = 1;
  pageSize = 10;
  pagination = signal<{ current: number; pages: number; total: number }>({ current: 1, pages: 1, total: 0 });

  formData: any = {
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    isActive: true,
    expiresAt: '',
    minOrderAmount: 0,
    description: '',
    usage: { maxUses: null }
  };

  confirmDialogOpen = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogConfirmClass = '';
  pendingAction: 'delete' | 'toggle' | null = null;
  selectedCoupon: any = null;

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.loading.set(true);
    this.adminService.getCoupons({ page: this.currentPage, limit: this.pageSize }).subscribe({
      next: (res) => {
        this.coupons.set(res.coupons || []);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les coupons');
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadCoupons();
  }

  openModal(coupon?: any) {
    if (coupon) {
      this.editingCoupon = coupon;
      this.formData = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        isActive: coupon.isActive,
        expiresAt: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
        minOrderAmount: coupon.minOrderAmount || 0,
        description: coupon.description || '',
        usage: { maxUses: coupon.usage?.totalLimit || null }
      };
    } else {
      this.editingCoupon = null;
      this.formData = {
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        isActive: true,
        expiresAt: '',
        minOrderAmount: 0,
        description: '',
        usage: { maxUses: null }
      };
    }
    this.modalOpen = true;
  }

  saveCoupon() {
    if (!this.formData.code || !this.formData.type) {
      this.toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const now = new Date();
    const expiresDate = this.formData.expiresAt 
      ? new Date(this.formData.expiresAt + 'T23:59:59.999Z')
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const data: any = {
      code: this.formData.code.toUpperCase(),
      type: this.formData.type,
      value: this.formData.value || 0,
      isActive: this.formData.isActive,
      minOrderAmount: this.formData.minOrderAmount || 0,
      description: this.formData.description || '',
      usage: {
        totalLimit: this.formData.usage?.maxUses || undefined,
        usedCount: this.editingCoupon?.usage?.usedCount || 0,
        perUserLimit: 1
      },
      validFrom: now.toISOString(),
      validUntil: expiresDate.toISOString()
    };

    if (this.formData.type === 'FREE_SHIPPING') {
      data.value = 0;
    }

    const request = this.editingCoupon
      ? this.adminService.updateCoupon(this.editingCoupon._id, data)
      : this.adminService.createCoupon(data);

    request.subscribe({
      next: () => {
        this.toast.success('Succès', this.editingCoupon ? 'Coupon mis à jour' : 'Coupon créé');
        this.modalOpen = false;
        this.loadCoupons();
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de sauvegarder le coupon');
      }
    });
  }

  toggleStatus(coupon: any) {
    this.selectedCoupon = coupon;
    this.pendingAction = 'toggle';
    this.dialogTitle = coupon.isActive ? 'Désactiver le coupon' : 'Activer le coupon';
    this.dialogMessage = coupon.isActive ? 'Ce coupon ne sera plus utilisable.' : 'Ce coupon sera activé.';
    this.dialogConfirmText = coupon.isActive ? 'Désactiver' : 'Activer';
    this.dialogConfirmClass = coupon.isActive ? 'bg-orange-600' : 'bg-green-600';
    this.confirmDialogOpen = true;
  }

  confirmDelete(coupon: any) {
    this.selectedCoupon = coupon;
    this.pendingAction = 'delete';
    this.dialogTitle = 'Supprimer le coupon';
    this.dialogMessage = `Voulez-vous vraiment supprimer le coupon ${coupon.code}?`;
    this.dialogConfirmText = 'Supprimer';
    this.dialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  confirmAction() {
    if (this.pendingAction === 'delete') {
      this.adminService.deleteCoupon(this.selectedCoupon._id).subscribe({
        next: () => {
          this.toast.success('Succès', 'Coupon supprimé');
          this.confirmDialogOpen = false;
          this.loadCoupons();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de supprimer le coupon');
          this.confirmDialogOpen = false;
        }
      });
    } else if (this.pendingAction === 'toggle') {
      this.adminService.updateCoupon(this.selectedCoupon._id, { isActive: !this.selectedCoupon.isActive }).subscribe({
        next: () => {
          this.toast.success('Succès', `Coupon ${this.selectedCoupon.isActive ? 'désactivé' : 'activé'}`);
          this.confirmDialogOpen = false;
          this.loadCoupons();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de modifier le coupon');
          this.confirmDialogOpen = false;
        }
      });
    }
  }

  isExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}