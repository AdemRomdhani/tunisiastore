import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, EmptyStateComponent, ConfirmDialogComponent],
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      z-index: 50; display: flex; align-items: flex-start; justify-content: flex-end;
    }
    .modal-panel {
      background: #fff; width: 100%; max-width: 520px; height: 100vh;
      overflow-y: auto; box-shadow: -4px 0 30px rgba(0,0,0,0.12);
      animation: slideIn 0.25s ease;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .status-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
    }
  `],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des commandes</h1>
          <p class="text-sm text-gray-500 mt-1">{{ filteredOrders().length }} commandes</p>
        </div>
        <div class="flex gap-2">
          <button (click)="exportOrders()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm p-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Rechercher par n° commande, client..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
            </div>
          </div>
          <select
            [(ngModel)]="filterStatus"
            (ngModelChange)="onFilter()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="PROCESSING">En préparation</option>
            <option value="SHIPPED">Expédiée</option>
            <option value="DELIVERED">Livrée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      @if (selectedOrders().length > 0) {
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-sm text-indigo-700 font-medium">
              {{ selectedOrders().length }} commande(s) sélectionnée(s)
            </span>
            <div class="flex flex-wrap gap-2">
              <select [(ngModel)]="bulkStatus" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">Changer le statut...</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="PROCESSING">En préparation</option>
                <option value="SHIPPED">Expédiée</option>
                <option value="DELIVERED">Livrée</option>
              </select>
              <button (click)="bulkUpdateStatus()" [disabled]="!bulkStatus" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                Appliquer
              </button>
              <button (click)="clearSelection()" class="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                Annuler
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-500">Chargement...</div>
        } @else if (filteredOrders().length === 0) {
          <app-empty-state
            title="Aucune commande"
            description="Aucune commande ne correspond à vos critères."
            icon="orders"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left">
                    <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="isAllSelected()" class="rounded border-gray-300">
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N°</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (order of paginatedOrders(); track order._id) {
                  <tr class="hover:bg-gray-50 transition" [class.bg-indigo-50]="isSelected(order._id)">
                    <td class="px-6 py-4">
                      <input type="checkbox" [checked]="isSelected(order._id)" (change)="toggleSelect(order._id)" class="rounded border-gray-300">
                    </td>
                    <td class="px-6 py-4 font-mono text-xs text-gray-700 font-medium">
                      {{ order.orderNumber }}
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {{ (order.user?.firstName || order.shippingAddress?.fullName || '?')[0] | uppercase }}
                        </div>
                        <div>
                          <div class="font-medium text-gray-800">
                            {{ order.user?.firstName || order.shippingAddress?.fullName || '—' }}
                          </div>
                          <div class="text-xs text-gray-400">
                            {{ order.user?.email || order.shippingAddress?.phone || '' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 font-bold text-gray-800">
                      {{ order.pricing?.total | number:'1.3' }} DT
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                        {{ paymentLabel(order.payment?.method) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <select
                        [ngModel]="order.status"
                        (change)="updateStatus(order._id, $any($event.target).value)"
                        [class]="'text-xs border rounded px-2 py-1 font-medium ' + statusColor(order.status)"
                      >
                        <option value="PENDING">En attente</option>
                        <option value="CONFIRMED">Confirmée</option>
                        <option value="PROCESSING">En préparation</option>
                        <option value="SHIPPED">Expédiée</option>
                        <option value="DELIVERED">Livrée</option>
                        <option value="CANCELLED">Annulée</option>
                      </select>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-1">
                        <button
                          (click)="openDetails(order)"
                          class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Détails"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button
                          (click)="printInvoice(order)"
                          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Imprimer facture"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a1 1 0 001-1v-4a1 1 0 00-.758-.703l-5.622-5.621a.997.997 0 00-.705-.209H9a1 1 0 00-1 1v7a1 1 0 001 1h4"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2h-3"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h6M9 9h6"/>
                          </svg>
                        </button>
                        <button
                          (click)="openNotes(order)"
                          class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                          title="Notes"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                          </svg>
                        </button>
                        <button
                          (click)="openDeleteConfirm(order._id)"
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
            [total]="filteredOrders().length"
            [pageSize]="pageSize"
            (pageChange)="onPageChange($event)"
          />
        }
      </div>
    </div>

    <!-- Order Details Modal -->
    @if (selectedOrder()) {
      <div class="modal-overlay" (click)="closeDetails()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h2 class="font-bold text-gray-900 text-base">Détails de la commande</h2>
              <p class="text-xs text-gray-400 font-mono mt-0.5">{{ selectedOrder()!.orderNumber }}</p>
            </div>
            <div class="flex gap-2">
              <button (click)="printInvoice(selectedOrder())" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Imprimer
              </button>
              <button (click)="closeDetails()" class="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <div class="flex items-center gap-3">
              <span [class]="'status-badge ' + statusBadgeClass(selectedOrder()!.status)">
                {{ statusLabel(selectedOrder()!.status) }}
              </span>
              <span class="text-xs text-gray-400">
                {{ selectedOrder()!.createdAt | date:'dd/MM/yyyy à HH:mm' }}
              </span>
            </div>

            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Client</h3>
              <div class="space-y-1.5">
                @if (selectedOrder()!.user?.firstName) {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Nom</span>
                    <span class="font-medium text-gray-800">
                      {{ selectedOrder()!.user!.firstName }} {{ selectedOrder()!.user!.lastName }}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Email</span>
                    <span class="font-medium text-gray-800">{{ selectedOrder()!.user!.email }}</span>
                  </div>
                  @if (selectedOrder()!.user!.phone) {
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Téléphone</span>
                      <span class="font-medium text-gray-800">{{ selectedOrder()!.user!.phone }}</span>
                    </div>
                  }
                } @else {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Nom</span>
                    <span class="font-medium text-gray-800">{{ selectedOrder()!.shippingAddress?.fullName }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Adresse de livraison</h3>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Destinataire</span>
                  <span class="font-medium text-gray-800">{{ selectedOrder()!.shippingAddress?.fullName }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Téléphone</span>
                  <span class="font-medium text-gray-800">{{ selectedOrder()!.shippingAddress?.phone }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Adresse</span>
                  <span class="font-medium text-gray-800 text-right max-w-[55%]">
                    {{ selectedOrder()!.shippingAddress?.streetAddress }},
                    {{ selectedOrder()!.shippingAddress?.city }},
                    {{ selectedOrder()!.shippingAddress?.governorate }}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Articles</h3>
              <div class="space-y-3">
                @for (item of selectedOrder()!.items; track item.product) {
                  <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                      <img [src]="getImageUrl(item.image)" class="w-full h-full object-contain" alt="{{ item.name }}" onerror="this.src='https://placehold.co/48x48?text=?'" width="48" height="48">
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-800 text-sm truncate">{{ item.name }}</div>
                      @if (item.selectedAttributes?.length > 0) {
                        <div class="text-xs text-gray-500">
                          @for (attr of item.selectedAttributes; track attr.name) {
                            <span class="mr-2">{{ attr.name }}: <b>{{ attr.value }}</b></span>
                          }
                        </div>
                      }
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="text-xs text-gray-500">x{{ item.quantity }}</div>
                      <div class="font-bold text-gray-800 text-sm">{{ item.subtotal | number:'1.3' }} DT</div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Récapitulatif</h3>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Sous-total</span>
                <span class="font-medium">{{ selectedOrder()!.pricing?.subtotal | number:'1.3' }} DT</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Livraison</span>
                <span class="font-medium">
                  {{ (selectedOrder()!.pricing?.shipping ?? 0) === 0 ? 'Gratuite' : ((selectedOrder()!.pricing?.shipping | number:'1.3') + ' DT') }}
                </span>
              </div>
              @if (selectedOrder()!.pricing?.discount && selectedOrder()!.pricing!.discount! > 0) {
                <div class="flex justify-between text-sm text-green-600">
                  <span>Remise</span>
                  <span class="font-medium">- {{ selectedOrder()!.pricing!.discount | number:'1.3' }} DT</span>
                </div>
              }
              <div class="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{{ selectedOrder()!.pricing?.total | number:'1.3' }} DT</span>
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Paiement</h3>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Méthode</span>
                  <span class="font-medium text-gray-800">{{ paymentLabel(selectedOrder()!.payment?.method) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Statut</span>
                  <span [class]="'font-medium ' + paymentStatusColor(selectedOrder()!.payment?.status)">
                    {{ paymentStatusLabel(selectedOrder()!.payment?.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Notes Modal -->
    @if (showNotesModal()) {
      <div class="modal-overlay" (click)="closeNotes()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 class="font-bold text-gray-900 text-base">Notes internes</h2>
            <button (click)="closeNotes()" class="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <div class="space-y-3 max-h-[50vh] overflow-y-auto">
              @if (orderNotes().length === 0) {
                <p class="text-center text-gray-400 py-4">Aucune note</p>
              }
              @for (note of orderNotes(); track $index) {
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p class="text-sm text-gray-700">{{ note.text }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ note.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              }
            </div>
            <div class="border-t pt-4">
              <textarea [(ngModel)]="newNote" rows="3" placeholder="Ajouter une note..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"></textarea>
              <button (click)="addNote()" [disabled]="!newNote.trim()" class="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                Ajouter la note
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <app-confirm-dialog
      [isOpen]="confirmDialogOpen"
      title="Supprimer la commande"
      message="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
      confirmText="Supprimer"
      confirmClass="bg-red-600"
      (confirmed)="confirmDelete()"
      (cancelled)="confirmDialogOpen = false"
    />
  `
})
export class AdminOrdersComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  apiUrl = this.adminService.baseUrl;

  orders = signal<any[]>([]);
  filteredOrders = signal<any[]>([]);
  paginatedOrders = signal<any[]>([]);
  selectedOrder = signal<any | null>(null);
  loading = signal(true);

  searchTerm = '';
  filterStatus = '';
  currentPage = 1;
  pageSize = 10;

  confirmDialogOpen = false;
  orderToDelete: string | null = null;

  selectedOrders = signal<string[]>([]);
  bulkStatus = '';

  showNotesModal = signal(false);
  orderNotes = signal<any[]>([]);
  newNote = '';
  orderForNotes: any = null;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.adminService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les commandes');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilter() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.orders();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.orderNumber?.toLowerCase().includes(term) ||
        o.user?.firstName?.toLowerCase().includes(term) ||
        o.user?.lastName?.toLowerCase().includes(term) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(term) ||
        o.user?.email?.toLowerCase().includes(term)
      );
    }

    if (this.filterStatus) {
      filtered = filtered.filter(o => o.status === this.filterStatus);
    }

    this.filteredOrders.set(filtered);
    this.updatePaginatedOrders();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedOrders();
  }

  updatePaginatedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedOrders.set(this.filteredOrders().slice(start, start + this.pageSize));
  }

  isSelected(id: string): boolean {
    return this.selectedOrders().includes(id);
  }

  isAllSelected(): boolean {
    return this.paginatedOrders().length > 0 && this.paginatedOrders().every(o => this.isSelected(o._id));
  }

  toggleSelect(id: string) {
    const current = this.selectedOrders();
    if (current.includes(id)) {
      this.selectedOrders.set(current.filter(oid => oid !== id));
    } else {
      this.selectedOrders.set([...current, id]);
    }
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedOrders.set(this.paginatedOrders().map(o => o._id));
    } else {
      this.selectedOrders.set([]);
    }
  }

  clearSelection() {
    this.selectedOrders.set([]);
    this.bulkStatus = '';
  }

  bulkUpdateStatus() {
    if (!this.bulkStatus || this.selectedOrders().length === 0) return;

    this.adminService.bulkUpdateOrders(this.selectedOrders(), this.bulkStatus).subscribe({
      next: () => {
        this.toast.success('Succès', `${this.selectedOrders().length} commande(s) mise(s) à jour`);
        this.clearSelection();
        this.loadOrders();
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de mettre à jour les commandes');
      }
    });
  }

  exportOrders() {
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    this.adminService.exportOrders('csv', params);
    this.toast.success('Export', 'Le fichier CSV sera téléchargé automatiquement');
  }

  printInvoice(order: any) {
    this.adminService.getOrderInvoice(order._id).subscribe({
      next: (res) => {
        const invoice = res.invoice;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
            <head>
              <title>Facture ${invoice.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .invoice-number { font-size: 24px; font-weight: bold; }
                .section { margin-bottom: 20px; }
                .section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
                th { background: #f9f9f9; }
                .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Tunisia Store</h1>
                <p class="invoice-number">Facture #${invoice.orderNumber}</p>
                <p>Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div class="section">
                <h3>Client</h3>
                <p><strong>${invoice.customer.name}</strong></p>
                <p>${invoice.customer.email || ''}</p>
                <p>${invoice.customer.phone || ''}</p>
              </div>
              <div class="section">
                <h3>Adresse de livraison</h3>
                <p>${invoice.customer.address?.fullName}</p>
                <p>${invoice.customer.address?.streetAddress}, ${invoice.customer.address?.city}</p>
                <p>${invoice.customer.address?.governorate}</p>
              </div>
              <div class="section">
                <h3>Articles</h3>
                <table>
                  <thead>
                    <tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map((item: any) => `
                      <tr>
                        <td>${item.name} ${item.sku ? '(' + item.sku + ')' : ''}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price} DT</td>
                        <td>${item.total} DT</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="section">
                <p>Sous-total: ${invoice.pricing.subtotal} DT</p>
                <p>Livraison: ${invoice.pricing.shipping === 0 ? 'Gratuite' : invoice.pricing.shipping + ' DT'}</p>
                ${invoice.pricing.discount > 0 ? `<p>Remise: -${invoice.pricing.discount} DT</p>` : ''}
                <p>Montant HT: ${invoice.pricing.ht} DT</p>
                <p>TVA (19%): ${invoice.pricing.tva} DT</p>
                ${invoice.pricing.timbre > 0 ? `<p>Timbre: ${invoice.pricing.timbre} DT</p>` : ''}
                <p class="total">Total TTC: ${invoice.pricing.total} DT</p>
              </div>
              <script>window.print();</script>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de générer la facture');
      }
    });
  }

  openNotes(order: any) {
    this.orderForNotes = order;
    this.showNotesModal.set(true);
    this.adminService.getOrderNotes(order._id).subscribe({
      next: (res) => this.orderNotes.set(res.internalNotes || []),
      error: () => this.toast.error('Erreur', 'Impossible de charger les notes')
    });
  }

  closeNotes() {
    this.showNotesModal.set(false);
    this.orderNotes.set([]);
    this.newNote = '';
    this.orderForNotes = null;
  }

  addNote() {
    if (!this.newNote.trim() || !this.orderForNotes) return;

    this.adminService.addOrderNote(this.orderForNotes._id, this.newNote.trim()).subscribe({
      next: (res) => {
        this.orderNotes.set(res.internalNotes || []);
        this.newNote = '';
        this.toast.success('Succès', 'Note ajoutée');
      },
      error: () => this.toast.error('Erreur', 'Impossible d\'ajouter la note')
    });
  }

  updateStatus(id: string, status: string) {
    this.adminService.updateOrderStatus(id, status).subscribe({
      next: () => {
        this.toast.success('Succès', 'Statut mis à jour');
        this.loadOrders();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de mettre à jour le statut');
        this.loadOrders();
      }
    });
  }

  openDeleteConfirm(id: string) {
    this.orderToDelete = id;
    this.confirmDialogOpen = true;
  }

  confirmDelete() {
    if (!this.orderToDelete) return;

    this.adminService.deleteOrder(this.orderToDelete).subscribe({
      next: () => {
        this.toast.success('Succès', 'Commande supprimée');
        this.confirmDialogOpen = false;
        if (this.selectedOrder()?._id === this.orderToDelete) {
          this.closeDetails();
        }
        this.loadOrders();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de supprimer');
        this.confirmDialogOpen = false;
      }
    });
  }

  openDetails(order: any) {
    this.selectedOrder.set(order);
  }

  closeDetails() {
    this.selectedOrder.set(null);
  }

  getImageUrl(path: string): string {
    if (!path) return 'https://placehold.co/48x48?text=?';
    if (path.startsWith('http')) return path;
    const baseUrl = this.apiUrl.replace('/api', '');
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
      SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée'
    };
    return map[status] || status;
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'border-yellow-300 bg-yellow-50 text-yellow-700',
      CONFIRMED: 'border-blue-300 bg-blue-50 text-blue-700',
      PROCESSING: 'border-indigo-300 bg-indigo-50 text-indigo-700',
      SHIPPED: 'border-purple-300 bg-purple-50 text-purple-700',
      DELIVERED: 'border-green-300 bg-green-50 text-green-700',
      CANCELLED: 'border-red-300 bg-red-50 text-red-700',
      REFUNDED: 'border-gray-300 bg-gray-100 text-gray-600',
    };
    return map[status] || '';
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-indigo-100 text-indigo-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  paymentLabel(method?: string): string {
    const map: Record<string, string> = {
      CASH_ON_DELIVERY: 'Paiement à la livraison',
      CARD_ONLINE: 'Carte bancaire',
      D17: 'D17', FLOUSSI: 'Floussi',
      BANK_TRANSFER: 'Virement bancaire',
      EDINAR: 'e-Dinar'
    };
    return method ? (map[method] || method) : '—';
  }

  paymentStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', PROCESSING: 'En cours', COMPLETED: 'Payé',
      FAILED: 'Échoué', REFUNDED: 'Remboursé', CANCELLED: 'Annulé'
    };
    return status ? (map[status] || status) : '—';
  }

  paymentStatusColor(status?: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'text-green-600', FAILED: 'text-red-600',
      REFUNDED: 'text-gray-500', CANCELLED: 'text-red-500',
      PENDING: 'text-yellow-600', PROCESSING: 'text-blue-600'
    };
    return status ? (map[status] || 'text-gray-700') : 'text-gray-400';
  }
}