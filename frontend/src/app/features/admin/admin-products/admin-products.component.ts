import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe, PaginationComponent, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des produits</h1>
        <a routerLink="/admin/products/new" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter un produit
        </a>
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
                placeholder="Rechercher un produit..."
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
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <select
            [(ngModel)]="filterStock"
            (ngModelChange)="onFilter()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            <option value="">Tout le stock</option>
            <option value="rupture">Rupture de stock</option>
            <option value="faible">Stock faible</option>
            <option value="available">En stock</option>
          </select>
          <button (click)="refresh()" class="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm flex items-center gap-1">
            <svg class="w-4 h-4" [class.animate-spin]="refreshing()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.003 8.003 0 0120 20v-5h.581m-16 0A8.003 8.003 0 004.582 12h5"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Bulk Actions -->
      @if (selectedProducts().length > 0) {
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-indigo-700 font-medium">
              {{ selectedProducts().length }} produit(s) sélectionné(s)
            </span>
            <div class="flex gap-2">
              <button (click)="bulkActivate()" class="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                Activer
              </button>
              <button (click)="bulkDeactivate()" class="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
                Désactiver
              </button>
              <button (click)="bulkDelete()" class="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                Supprimer
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
        } @else if (products().length === 0) {
          <app-empty-state
            title="Aucun produit"
            description="Commencez par ajouter votre premier produit."
            icon="products"
          >
            <a routerLink="/admin/products/new" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Ajouter un produit
            </a>
          </app-empty-state>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left">
                    <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="isAllSelected()" class="rounded border-gray-300">
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (product of paginatedProducts(); track product._id) {
                  <tr class="hover:bg-gray-50 transition" [class.bg-indigo-50]="isSelected(product._id)">
                    <td class="px-6 py-4">
                      <input type="checkbox" [checked]="isSelected(product._id)" (change)="toggleSelect(product._id)" class="rounded border-gray-300">
                    </td>
                    <td class="px-6 py-4">
                      <img [src]="product.media?.images?.[0] | imageUrl" width="48" height="48" class="w-12 h-12 object-contain bg-gray-50 rounded-lg border border-gray-100">
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <p class="font-medium text-gray-900">{{ product.name }}</p>
                        <p class="text-xs text-gray-500">{{ product.category?.name || 'Non catégorisé' }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="font-bold text-gray-900">{{ product.pricing?.price | number:'1.3' }} DT</span>
                      @if (product.pricing?.originalPrice && product.pricing.originalPrice > product.pricing.price) {
                        <span class="text-xs text-gray-400 line-through ml-2">{{ product.pricing.originalPrice | number:'1.3' }}</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      @if ((product.inventory?.quantity || 0) - (product.inventory?.reserved || 0) <= 0) {
                        <div class="flex items-center gap-2">
                          <span class="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">0</span>
                          <span class="text-xs text-red-600 font-medium">Rupture</span>
                        </div>
                      } @else if ((product.inventory?.quantity || 0) - (product.inventory?.reserved || 0) <= (product.inventory?.lowStockThreshold || 5)) {
                        <div class="flex items-center gap-2">
                          <span class="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">{{ (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0) }}</span>
                          <span class="text-xs text-orange-600 font-medium">Faible</span>
                        </div>
                      } @else {
                        <span class="text-green-600 font-medium">{{ (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0) }}</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      @if (product.isActive) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Actif
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Inactif
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="openAddStockModal(product)"
                          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ajouter du stock"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                          </svg>
                        </button>
                        <a
                          [routerLink]="['/admin/products/edit', product._id]"
                          class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </a>
                        <button
                          (click)="toggleStatus(product)"
                          class="p-2 rounded-lg transition"
                          [class.text-green-600]="!product.isActive"
                          [class.hover:bg-green-50]="!product.isActive"
                          [class.text-gray-400]="product.isActive"
                          [class.hover:bg-gray-100]="product.isActive"
                          [title]="product.isActive ? 'Désactiver' : 'Activer'"
                        >
                          @if (product.isActive) {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                            </svg>
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [total]="filteredProducts().length"
            [pageSize]="pageSize"
            (pageChange)="onPageChange($event)"
          />
        }
      </div>
    </div>

    <app-confirm-dialog
      [isOpen]="confirmDialogOpen"
      [title]="dialogTitle"
      [message]="dialogMessage"
      [confirmText]="dialogConfirmText"
      [confirmClass]="dialogConfirmClass"
      (confirmed)="confirmAction()"
      (cancelled)="confirmDialogOpen = false"
    />

    <!-- Add Stock Modal -->
    @if (addStockModalOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="addStockModalOpen = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Ajouter du stock</h3>
            <p class="text-sm text-gray-600 mb-4">
              Produit: <span class="font-medium">{{ selectedProduct?.name }}</span>
            </p>
            <p class="text-sm text-gray-500 mb-4">
              Stock actuel: <span class="font-medium text-green-600">{{ (selectedProduct?.inventory?.quantity || 0) - (selectedProduct?.inventory?.reserved || 0) }}</span>
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quantité à ajouter</label>
              <input
                type="number"
                [(ngModel)]="stockToAdd"
                min="1"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Ex: 10"
              >
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <button
              (click)="addStockModalOpen = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Annuler
            </button>
            <button
              (click)="confirmAddStock()"
              [disabled]="!stockToAdd || stockToAdd <= 0"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminProductsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  products = signal<any[]>([]);
  filteredProducts = signal<any[]>([]);
  paginatedProducts = signal<any[]>([]);
  loading = signal(true);
  refreshing = signal(false);

  searchTerm = '';
  filterStatus = '';
  filterStock = '';
  currentPage = 1;
  pageSize = 10;

  confirmDialogOpen = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogConfirmClass = '';
  pendingAction: 'activate' | 'deactivate' | 'delete' | 'bulkActivate' | 'bulkDeactivate' | 'bulkDelete' | null = null;
  selectedProduct: any = null;

  addStockModalOpen = false;
  stockToAdd: number | null = null;

  selectedProducts = signal<string[]>([]);

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.adminService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les produits');
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
    let filtered = this.products();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }

    if (this.filterStatus) {
      filtered = filtered.filter(p =>
        this.filterStatus === 'active' ? p.isActive : !p.isActive
      );
    }

    if (this.filterStock) {
      filtered = filtered.filter(p => {
        const qty = p.inventory?.quantity || 0;
        const reserved = p.inventory?.reserved || 0;
        const available = qty - reserved;
        
        if (this.filterStock === 'rupture') return available <= 0;
        if (this.filterStock === 'faible') return available > 0 && available <= (p.inventory?.lowStockThreshold || 5);
        if (this.filterStock === 'available') return available > (p.inventory?.lowStockThreshold || 5);
        return true;
      });
    }

    this.filteredProducts.set(filtered);
    this.updatePaginatedProducts();
  }

  refresh() {
    this.refreshing.set(true);
    this.adminService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.products || []);
        this.applyFilters();
        this.refreshing.set(false);
      },
      error: () => {
        this.refreshing.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedProducts.set(this.filteredProducts().slice(start, start + this.pageSize));
  }

  isSelected(id: string): boolean {
    return this.selectedProducts().includes(id);
  }

  isAllSelected(): boolean {
    return this.paginatedProducts().length > 0 && this.paginatedProducts().every(p => this.isSelected(p._id));
  }

  toggleSelect(id: string) {
    const current = this.selectedProducts();
    if (current.includes(id)) {
      this.selectedProducts.set(current.filter(pid => pid !== id));
    } else {
      this.selectedProducts.set([...current, id]);
    }
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedProducts.set(this.paginatedProducts().map(p => p._id));
    } else {
      this.selectedProducts.set([]);
    }
  }

  clearSelection() {
    this.selectedProducts.set([]);
  }

  toggleStatus(product: any) {
    this.selectedProduct = product;
    this.pendingAction = product.isActive ? 'deactivate' : 'activate';
    this.dialogTitle = product.isActive ? 'Désactiver le produit' : 'Activer le produit';
    this.dialogMessage = product.isActive ? 'Ce produit ne sera plus visible sur le site.' : 'Ce produit sera visible sur le site.';
    this.dialogConfirmText = product.isActive ? 'Désactiver' : 'Activer';
    this.dialogConfirmClass = product.isActive ? 'bg-orange-600' : 'bg-green-600';
    this.confirmDialogOpen = true;
  }

  bulkActivate() {
    this.pendingAction = 'bulkActivate';
    this.dialogTitle = 'Activer les produits';
    this.dialogMessage = `${this.selectedProducts().length} produit(s) seront activés.`;
    this.dialogConfirmText = 'Activer';
    this.dialogConfirmClass = 'bg-green-600';
    this.confirmDialogOpen = true;
  }

  bulkDeactivate() {
    this.pendingAction = 'bulkDeactivate';
    this.dialogTitle = 'Désactiver les produits';
    this.dialogMessage = `${this.selectedProducts().length} produit(s) seront désactivés.`;
    this.dialogConfirmText = 'Désactiver';
    this.dialogConfirmClass = 'bg-orange-600';
    this.confirmDialogOpen = true;
  }

  bulkDelete() {
    this.pendingAction = 'bulkDelete';
    this.dialogTitle = 'Supprimer les produits';
    this.dialogMessage = `${this.selectedProducts().length} produit(s) seront supprimés définitivement. Cette action est irréversible.`;
    this.dialogConfirmText = 'Supprimer';
    this.dialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  confirmAction() {
    if (!this.pendingAction) return;

    switch (this.pendingAction) {
      case 'activate':
        this.adminService.updateProduct(this.selectedProduct._id, { isActive: true } as any).subscribe({
          next: () => {
            this.toast.success('Succès', 'Produit activé avec succès');
            this.confirmDialogOpen = false;
            this.loadProducts();
          },
          error: () => {
            this.toast.error('Erreur', 'Impossible de modifier le produit');
            this.confirmDialogOpen = false;
          }
        });
        break;
      case 'deactivate':
        this.adminService.updateProduct(this.selectedProduct._id, { isActive: false } as any).subscribe({
          next: () => {
            this.toast.success('Succès', 'Produit désactivé avec succès');
            this.confirmDialogOpen = false;
            this.loadProducts();
          },
          error: () => {
            this.toast.error('Erreur', 'Impossible de modifier le produit');
            this.confirmDialogOpen = false;
          }
        });
        break;
      case 'bulkActivate':
        this.adminService.bulkUpdateProducts({ productIds: this.selectedProducts(), action: 'activate' }).subscribe({
          next: () => {
            this.toast.success('Succès', `${this.selectedProducts().length} produit(s) activé(s)`);
            this.confirmDialogOpen = false;
            this.clearSelection();
            this.loadProducts();
          },
          error: () => {
            this.toast.error('Erreur', 'Impossible d\'activer les produits');
            this.confirmDialogOpen = false;
          }
        });
        break;
      case 'bulkDeactivate':
        this.adminService.bulkUpdateProducts({ productIds: this.selectedProducts(), action: 'deactivate' }).subscribe({
          next: () => {
            this.toast.success('Succès', `${this.selectedProducts().length} produit(s) désactivé(s)`);
            this.confirmDialogOpen = false;
            this.clearSelection();
            this.loadProducts();
          },
          error: () => {
            this.toast.error('Erreur', 'Impossible de désactiver les produits');
            this.confirmDialogOpen = false;
          }
        });
        break;
      case 'bulkDelete':
        this.adminService.bulkUpdateProducts({ productIds: this.selectedProducts(), action: 'delete' }).subscribe({
          next: () => {
            this.toast.success('Succès', `${this.selectedProducts().length} produit(s) supprimé(s)`);
            this.confirmDialogOpen = false;
            this.clearSelection();
            this.loadProducts();
          },
          error: () => {
            this.toast.error('Erreur', 'Impossible de supprimer les produits');
            this.confirmDialogOpen = false;
          }
        });
        break;
    }
  }

  openAddStockModal(product: any) {
    this.selectedProduct = product;
    this.stockToAdd = null;
    this.addStockModalOpen = true;
  }

  confirmAddStock() {
    if (!this.selectedProduct || !this.stockToAdd || this.stockToAdd <= 0) return;

    this.adminService.addStock(this.selectedProduct._id, this.stockToAdd).subscribe({
      next: (res) => {
        this.toast.success('Succès', res.message || `Stock ajouté: ${this.stockToAdd}`);
        this.addStockModalOpen = false;
        this.loadProducts();
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible d\'ajouter le stock');
      }
    });
  }
}