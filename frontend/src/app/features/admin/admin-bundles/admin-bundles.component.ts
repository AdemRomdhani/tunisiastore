import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface Bundle {
  _id: string;
  name: string;
  slug: string;
  description: string;
  products: Array<{
    product: {
      _id: string;
      name: string;
      slug: string;
      pricing: { price: number };
      media: { images: string[] };
    };
    quantity: number;
  }>;
  pricing: { price: number; originalPrice: number; discountPercentage: number };
  isActive: boolean;
}

@Component({
  selector: 'app-admin-bundles',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ImageUrlPipe, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des bundles</h1>
        <button (click)="openModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter un bundle
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-8 text-gray-500">Chargement...</div>
      } @else if (bundles().length === 0) {
        <app-empty-state
          title="Aucun bundle"
          description="Créez des packs produits pour augmenter les ventes."
          icon="products"
        />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (bundle of bundles(); track bundle._id) {
            <div class="bg-white rounded-xl shadow-sm p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-gray-900">{{ bundle.name }}</h3>
                <div class="flex gap-1">
                  <button (click)="editBundle(bundle)" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button (click)="toggleStatus(bundle)" class="p-1.5 rounded" [class.text-green-600]="bundle.isActive" [class.hover:bg-green-50]="bundle.isActive" [class.text-gray-400]="!bundle.isActive" [class.hover:bg-gray-100]="!bundle.isActive">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </button>
                  <button (click)="confirmDelete(bundle)" class="p-1.5 text-red-600 hover:bg-red-50 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m4-6v6"/>
                    </svg>
                  </button>
                </div>
              </div>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ bundle.description }}</p>
              <div class="flex gap-2 mb-3">
                @for (item of bundle.products; track item.product._id) {
                  <img [src]="item.product.media?.images?.[0] | imageUrl" [alt]="item.product.name" class="w-10 h-10 object-contain bg-gray-50 rounded border">
                }
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-xl font-bold text-indigo-600">{{ bundle.pricing.price | number:'1.3' }} DT</span>
                @if (bundle.pricing.originalPrice > bundle.pricing.price) {
                  <span class="text-sm text-gray-400 line-through">{{ bundle.pricing.originalPrice | number:'1.3' }} DT</span>
                  <span class="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">-{{ bundle.pricing.discountPercentage }}%</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Confirm Dialog -->
    <app-confirm-dialog
      [isOpen]="confirmDialogOpen"
      [title]="dialogTitle"
      [message]="dialogMessage"
      [confirmText]="dialogConfirmText"
      [confirmClass]="dialogConfirmClass"
      (confirmed)="confirmAction()"
      (cancelled)="confirmDialogOpen = false"
    />

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b">
            <h2 class="text-xl font-bold">{{ editingBundle ? 'Modifier' : 'Ajouter' }} un bundle</h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nom du bundle *</label>
              <input type="text" [(ngModel)]="form.name" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Description</label>
              <textarea [(ngModel)]="form.description" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Prix du bundle *</label>
                <input type="number" [(ngModel)]="form.price" step="0.001" class="w-full px-4 py-2 border rounded-lg" required>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Prix original</label>
                <input type="number" [(ngModel)]="form.originalPrice" step="0.001" class="w-full px-4 py-2 border rounded-lg">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Produits du bundle</label>
              <div class="space-y-2 mb-2">
                @for (item of selectedProducts; track item.productId; let i = $index) {
                  <div class="flex gap-2 items-center">
                    <select [(ngModel)]="item.productId" class="flex-1 px-3 py-2 border rounded-lg">
                      <option value="">Sélectionner un produit</option>
                      @for (p of availableProducts(); track p._id) {
                        <option [value]="p._id">{{ p.name }} - {{ p.pricing?.price }} DT</option>
                      }
                    </select>
                    <input type="number" [(ngModel)]="item.quantity" min="1" class="w-16 px-3 py-2 border rounded-lg text-center">
                    <button (click)="removeProduct(i)" class="p-2 text-red-600 hover:bg-red-50 rounded">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
              <button (click)="addProduct()" type="button" class="text-sm text-indigo-600 hover:text-indigo-800">+ Ajouter un produit</button>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="form.isActive" id="active" class="rounded">
              <label for="active" class="text-sm">Bundle actif</label>
            </div>
          </div>
          <div class="p-6 border-t flex justify-end gap-3">
            <button (click)="closeModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
            <button (click)="saveBundle()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              {{ editingBundle ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminBundlesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/bundles`;
  private productsUrl = `${environment.apiUrl}/products`;

  bundles = signal<Bundle[]>([]);
  availableProducts = signal<any[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingBundle: Bundle | null = null;

  confirmDialogOpen = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogConfirmClass = '';
  pendingBundle: Bundle | null = null;

  form = {
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    isActive: true
  };
  selectedProducts: Array<{ productId: string; quantity: number }> = [];

  ngOnInit() {
    this.loadBundles();
    this.loadProducts();
  }

  loadBundles() {
    this.http.get<any>(`${this.apiUrl}?includeInactive=true`).subscribe({
      next: (res) => {
        this.bundles.set(res.bundles || []);
        this.loading.set(false);
      }
    });
  }

  loadProducts() {
    this.http.get<any>(`${this.productsUrl}?limit=100`).subscribe({
      next: (res) => {
        this.availableProducts.set(res.products || []);
      }
    });
  }

  openModal() {
    this.editingBundle = null;
    this.form = { name: '', description: '', price: 0, originalPrice: 0, isActive: true };
    this.selectedProducts = [{ productId: '', quantity: 1 }];
    this.showModal.set(true);
  }

  editBundle(bundle: Bundle) {
    this.editingBundle = bundle;
    this.form = {
      name: bundle.name,
      description: bundle.description || '',
      price: bundle.pricing.price,
      originalPrice: bundle.pricing.originalPrice,
      isActive: bundle.isActive
    };
    this.selectedProducts = bundle.products.map(p => ({
      productId: (p.product as any)._id || p.product,
      quantity: p.quantity
    }));
    if (this.selectedProducts.length === 0) {
      this.selectedProducts = [{ productId: '', quantity: 1 }];
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingBundle = null;
  }

  addProduct() {
    this.selectedProducts.push({ productId: '', quantity: 1 });
  }

  removeProduct(index: number) {
    this.selectedProducts.splice(index, 1);
  }

  saveBundle() {
    const products = this.selectedProducts
      .filter(p => p.productId)
      .map(p => ({ product: p.productId, quantity: p.quantity }));

    if (!this.form.name || products.length === 0) {
      this.toast.error('Erreur', 'Nom et produits requis');
      return;
    }

    const data = {
      name: this.form.name,
      slug: this.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: this.form.description,
      pricing: {
        price: this.form.price,
        originalPrice: this.form.originalPrice || this.form.price
      },
      products,
      isActive: this.form.isActive
    };

    if (this.editingBundle) {
      this.http.put(`${this.apiUrl}/${this.editingBundle._id}`, data).subscribe({
        next: () => {
          this.toast.success('Succès', 'Bundle mis à jour');
          this.loadBundles();
          this.closeModal();
        },
        error: () => this.toast.error('Erreur', 'Échec de mise à jour')
      });
    } else {
      this.http.post(this.apiUrl, data).subscribe({
        next: () => {
          this.toast.success('Succès', 'Bundle créé');
          this.loadBundles();
          this.closeModal();
        },
        error: () => this.toast.error('Erreur', 'Échec de création')
      });
    }
  }

  toggleStatus(bundle: Bundle) {
    this.http.put(`${this.apiUrl}/${bundle._id}`, { isActive: !bundle.isActive }).subscribe({
      next: () => this.loadBundles()
    });
  }

  confirmDelete(bundle: Bundle) {
    this.pendingBundle = bundle;
    this.dialogTitle = 'Confirmer la suppression';
    this.dialogMessage = `Voulez-vous vraiment supprimer le bundle "${bundle.name}" ?`;
    this.dialogConfirmText = 'Supprimer';
    this.dialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  confirmAction() {
    if (this.pendingBundle) {
      this.http.delete(`${this.apiUrl}/${this.pendingBundle._id}`).subscribe({
        next: () => {
          this.toast.success('Succès', 'Bundle supprimé');
          this.loadBundles();
        },
        error: () => this.toast.error('Erreur', 'Échec de suppression')
      });
    }
    this.confirmDialogOpen = false;
    this.pendingBundle = null;
  }
}