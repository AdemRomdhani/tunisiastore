import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <div class="flex gap-2">
          <button (click)="exportCsv()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
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
                placeholder="Rechercher par nom, email..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
            </div>
          </div>
          <select
            [(ngModel)]="filterRole"
            (ngModelChange)="onFilter()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Tous les rôles</option>
            <option value="customer">Client</option>
            <option value="admin">Administrateur</option>
            <option value="supervisor">Superviseur</option>
          </select>
          <select
            [(ngModel)]="filterStatus"
            (ngModelChange)="onFilter()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Désactivés</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-500">Chargement...</div>
        } @else if (users().length === 0) {
          <app-empty-state
            title="Aucun utilisateur"
            description="Aucun utilisateur ne correspond à vos critères."
            icon="users"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Commandes</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Inscription</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (user of paginatedUsers(); track user._id) {
                  <tr class="hover:bg-gray-50 transition" [class.bg-red-50]="!user.isActive">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span class="text-sm font-bold text-indigo-600">
                            {{ (user.firstName?.[0] || '') + (user.lastName?.[0] || '') | uppercase }}
                          </span>
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</p>
                          <p class="text-xs text-gray-500">{{ user.phone || 'Pas de téléphone' }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-gray-600">{{ user.email }}</td>
                    <td class="px-6 py-4">
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        [class]="{'bg-purple-100 text-purple-700': user.role === 'admin', 'bg-blue-100 text-blue-700': user.role === 'supervisor', 'bg-gray-100 text-gray-600': user.role === 'customer'}"
                      >
                        {{ user.role === 'admin' ? 'Admin' : (user.role === 'supervisor' ? 'Superviseur' : 'Client') }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        [class]="user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                      >
                        {{ user.isActive ? 'Actif' : 'Désactivé' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">{{ user.orderCount || 0 }}</td>
                    <td class="px-6 py-4 text-gray-500">{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button (click)="viewOrders(user)" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Commandes
                        </button>
                        @if (user.role !== 'admin' && user.role !== 'supervisor') {
                          <button (click)="toggleStatus(user)" class="text-xs text-gray-600 hover:text-gray-800 font-medium">
                            {{ user.isActive ? 'Désactiver' : 'Activer' }}
                          </button>
                          <div class="relative">
                            <button (click)="toggleRoleMenu(user)" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                              Promouvoir ▾
                            </button>
                            @if (showRoleMenuFor === user._id) {
                              <div class="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                                <button (click)="promoteToRole(user, 'admin')" class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                  Administrateur
                                </button>
                                <button (click)="promoteToRole(user, 'supervisor')" class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                  Superviseur
                                </button>
                              </div>
                            }
                          </div>
                        } @else {
                          <button (click)="demoteToUser(user)" class="text-xs text-red-600 hover:text-red-800 font-medium">
                            Rétrograder
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [total]="filteredUsers().length"
            [pageSize]="pageSize"
            (pageChange)="onPageChange($event)"
          />
        }
      </div>
    </div>

    <!-- User Orders Modal -->
    @if (showOrdersModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div class="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">
              Commandes de {{ selectedUserForOrders()?.firstName }} {{ selectedUserForOrders()?.lastName }}
            </h2>
            <button (click)="closeOrdersModal()" class="p-2 hover:bg-gray-100 rounded-lg">
              <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            @if (userOrders().length === 0) {
              <p class="text-center text-gray-500 py-8">Aucune commande pour cet utilisateur</p>
            } @else {
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left">N° Commande</th>
                    <th class="px-4 py-3 text-left">Date</th>
                    <th class="px-4 py-3 text-left">Total</th>
                    <th class="px-4 py-3 text-left">Statut</th>
                    <th class="px-4 py-3 text-left">Paiement</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (order of userOrders(); track order._id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 font-medium">{{ order.orderNumber }}</td>
                      <td class="px-4 py-3">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-4 py-3">{{ order.pricing?.total | number:'1.2-2' }} DT</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold" [class]="statusClass(order.status)">
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="px-4 py-3">{{ order.payment?.status }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    }

    <!-- Confirm Dialog -->
    <app-confirm-dialog
      [isOpen]="confirmDialogOpen"
      [title]="confirmDialogTitle"
      [message]="confirmDialogMessage"
      [confirmText]="confirmDialogConfirmText"
      [confirmClass]="confirmDialogConfirmClass"
      (confirmed)="confirmAction()"
      (cancelled)="confirmDialogOpen = false"
    />
  `
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  users = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);
  loading = signal(true);

  searchTerm = '';
  filterRole = '';
  filterStatus = '';
  currentPage = 1;
  pageSize = 10;

  paginatedUsers = signal<any[]>([]);

  confirmDialogOpen = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  confirmDialogConfirmText = '';
  confirmDialogConfirmClass = '';
  selectedUser: any = null;
  pendingAction: 'promote' | 'demote' | 'toggleStatus' | 'admin' | 'supervisor' | null = null;
  showRoleMenuFor: string | null = null;

  showOrdersModal = signal(false);
  selectedUserForOrders = signal<any>(null);
  userOrders = signal<any[]>([]);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users.set(res.users || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les utilisateurs');
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
    let filtered = this.users();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }

    if (this.filterRole) {
      filtered = filtered.filter(u => u.role === this.filterRole);
    }

    if (this.filterStatus !== '') {
      const isActive = this.filterStatus === 'true';
      filtered = filtered.filter(u => u.isActive === isActive);
    }

    this.filteredUsers.set(filtered);
    this.updatePaginatedUsers();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedUsers.set(this.filteredUsers().slice(start, start + this.pageSize));
  }

  viewOrders(user: any) {
    this.selectedUserForOrders.set(user);
    this.showOrdersModal.set(true);
    this.adminService.getUserOrders(user._id).subscribe({
      next: (res) => this.userOrders.set(res.orders || []),
      error: () => this.toast.error('Erreur', 'Impossible de charger les commandes')
    });
  }

  closeOrdersModal() {
    this.showOrdersModal.set(false);
    this.selectedUserForOrders.set(null);
    this.userOrders.set([]);
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PROCESSING: 'bg-indigo-100 text-indigo-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  exportCsv() {
    this.adminService.exportUsers('csv');
    this.toast.success('Export', 'Le fichier CSV sera téléchargé automatiquement');
  }

  promoteToAdmin(user: any) {
    this.selectedUser = user;
    this.pendingAction = 'promote';
    this.confirmDialogTitle = 'Confirmer la promotion';
    this.confirmDialogMessage = `Voulez-vous promouvoir ${user.firstName} ${user.lastName} en tant qu'administrateur ?`;
    this.confirmDialogConfirmText = 'Promouvoir';
    this.confirmDialogConfirmClass = 'bg-indigo-600';
    this.confirmDialogOpen = true;
  }

  demoteToUser(user: any) {
    this.selectedUser = user;
    this.pendingAction = 'demote';
    this.confirmDialogTitle = 'Confirmer la rétrogradation';
    this.confirmDialogMessage = `Voulez-vous rétrograder ${user.firstName} ${user.lastName} en tant que client ?`;
    this.confirmDialogConfirmText = 'Rétrograder';
    this.confirmDialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  toggleRoleMenu(user: any) {
    this.showRoleMenuFor = this.showRoleMenuFor === user._id ? null : user._id;
  }

  promoteToRole(user: any, role: 'admin' | 'supervisor') {
    this.showRoleMenuFor = null;
    this.selectedUser = user;
    this.pendingAction = role;
    const roleLabel = role === 'admin' ? 'administrateur' : 'superviseur';
    this.confirmDialogTitle = 'Confirmer la promotion';
    this.confirmDialogMessage = `Voulez-vous promouvoir ${user.firstName} ${user.lastName} en tant que ${roleLabel} ?`;
    this.confirmDialogConfirmText = 'Promouvoir';
    this.confirmDialogConfirmClass = 'bg-indigo-600';
    this.confirmDialogOpen = true;
  }

  toggleStatus(user: any) {
    this.selectedUser = user;
    this.pendingAction = 'toggleStatus';
    const action = user.isActive ? 'désactiver' : 'activer';
    this.confirmDialogTitle = `Confirmer ${action}`;
    this.confirmDialogMessage = `Voulez-vous ${action} le compte de ${user.firstName} ${user.lastName} ?`;
    this.confirmDialogConfirmText = action.charAt(0).toUpperCase() + action.slice(1);
    this.confirmDialogConfirmClass = user.isActive ? 'bg-red-600' : 'bg-green-600';
    this.confirmDialogOpen = true;
  }

  confirmAction() {
    if (!this.selectedUser || !this.pendingAction) return;

    if (this.pendingAction === 'toggleStatus') {
      this.adminService.updateUser(this.selectedUser._id, { isActive: !this.selectedUser.isActive }).subscribe({
        next: () => {
          this.toast.success('Succès', `Compte ${this.selectedUser.isActive ? 'désactivé' : 'activé'}`);
          this.confirmDialogOpen = false;
          this.loadUsers();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de modifier le statut');
          this.confirmDialogOpen = false;
        }
      });
      return;
    }

    const role = this.pendingAction === 'demote' ? 'customer' : this.pendingAction;

    this.adminService.updateUser(this.selectedUser._id, { role }).subscribe({
      next: () => {
        const actionText = this.pendingAction === 'demote' ? 'rétrogradé' : 'promu';
        this.toast.success('Succès', `${this.selectedUser.firstName} a été ${actionText}`);
        this.confirmDialogOpen = false;
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Erreur', `Impossible de ${this.pendingAction === 'promote' ? 'promouvoir' : 'rétrograder'} l'utilisateur`);
        this.confirmDialogOpen = false;
      }
    });
  }
}