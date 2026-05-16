import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEdit() ? 'Modifier' : 'Ajouter' }} un produit
      </h1>

      @if (loading()) {
        <div class="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3 text-gray-400">
            <svg class="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span class="text-sm">Chargement du produit...</span>
          </div>
        </div>
      } @else {
        <form (ngSubmit)="saveProduct()" autocomplete="off" class="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
            <input type="text" [(ngModel)]="product.name" name="name" required class="input-field">
          </div>

          <!-- Category Dropdown -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select [(ngModel)]="product.category" name="category" required class="input-field">
              <option value="">Sélectionner une catégorie</option>
              @for (cat of categories(); track cat._id) {
                <option [value]="cat._id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Prices -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prix (TND) *</label>
              <input type="number" [(ngModel)]="product.price" name="price" required step="0.001" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prix original (promo)</label>
              <input type="number" [(ngModel)]="product.originalPrice" name="originalPrice" step="0.001" class="input-field">
            </div>
          </div>

          <!-- Stock & SKU -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input type="number" [(ngModel)]="product.stock" name="stock" required class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" [(ngModel)]="product.sku" name="sku" class="input-field">
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea [(ngModel)]="product.description" name="description" rows="4" required class="input-field"></textarea>
          </div>

          <!-- Badges & Featured -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Badges & Spécial</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.featured" name="featured" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">En vedette</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.badgePromo" name="badgePromo" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Promo</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.badgeNew" name="badgeNew" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Nouveau</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.badgeBestseller" name="badgeBestseller" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Bestseller</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.badgeExclusive" name="badgeExclusive" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Exclusif</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.badgeFreeShipping" name="badgeFreeShipping" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Livraison gratuite</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="product.badgeStockLimited" name="badgeStockLimited" class="w-4 h-4 text-primary-600 rounded">
                <span class="text-sm text-gray-700">Stock limité</span>
              </label>
            </div>
          </div>

          <!-- Sale & Promotions -->
          <div class="bg-primary-50 rounded-xl p-4 border border-primary-100 space-y-4">
            <h3 class="text-sm font-bold text-primary-900 flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
              </svg>
              Offre Flash & Promotion
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" [(ngModel)]="product.onSale" name="onSale" class="w-5 h-5 text-primary-600 rounded-lg border-gray-300 focus:ring-primary-500">
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition">En vente promo</span>
                    <span class="text-xs text-gray-500">Activer le prix promotionnel</span>
                  </div>
                </label>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date de fin (Offre Flash)</label>
                <div class="relative">
                  <input 
                    type="datetime-local" 
                    [(ngModel)]="product.saleEndsAt" 
                    name="saleEndsAt" 
                    class="input-field pr-10"
                    (change)="onSaleDatePicked()"
                    [required]="product.onSale"
                  >
                </div>
                <p class="text-[10px] text-gray-400 mt-1">Laissez vide pour une promo permanente</p>
              </div>
            </div>
          </div>

          <!-- Existing Images (edit mode) -->
          @if (isEdit() && existingImages().length > 0) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Images actuelles</label>
              <div class="flex flex-wrap gap-3">
                @for (img of existingImages(); track img) {
                  <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img [src]="getImageUrl(img)" class="w-full h-full object-contain" alt="Image produit" width="80" height="80" loading="lazy" decoding="async">
                  </div>
                }
              </div>
              <p class="text-xs text-gray-400 mt-1">Téléverser de nouvelles images remplacera les images actuelles.</p>
            </div>
          }

          <!-- Images Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ isEdit() ? 'Remplacer les images (optionnel)' : 'Images' }}
            </label>
            <input 
              type="file" 
              (change)="onFilesSelected($event)"
              multiple 
              accept="image/*"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            >
            @if (selectedFiles().length > 0) {
              <p class="text-xs text-gray-500 mt-1">{{ selectedFiles().length }} fichier(s) sélectionné(s)</p>
            }
          </div>

          @if (error()) {
            <div class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{{ error() }}</div>
          }

          <div class="flex gap-4">
            <button type="submit" [disabled]="saving()" class="btn-primary">
              {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
            <a routerLink="/admin/products" class="btn-secondary">Annuler</a>
          </div>
        </form>
      }
    </div>
  `
})
export class AdminProductFormComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  selectedFiles = signal<File[]>([]);
  categories = signal<Category[]>([]);
  existingImages = signal<string[]>([]);
  error = signal('');
  
  private productId?: string;
  private refreshInterval?: ReturnType<typeof setInterval>;
  
  product: any = {
    name: '',
    category: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    sku: '',
    description: '',
    featured: false,
    badgePromo: false,
    badgeNew: false,
    badgeBestseller: false,
    badgeExclusive: false,
    badgeFreeShipping: false,
    badgeStockLimited: false,
    onSale: false,
    saleEndsAt: ''
  };

  ngOnInit() {
    this.loadCategories();
    const id = this.route.snapshot.params['id'];
    if (id && !this.productId) {
      this.isEdit.set(true);
      this.productId = id;
      this.loadProduct(id);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => this.categories.set(res.categories)
    });
  }

  loadProduct(id: string, silent: boolean = false) {
    console.log('loadProduct called', id, 'silent:', silent);
    if (!silent) {
      this.loading.set(true);
    }
    this.adminService.getProduct(id).subscribe({
      next: (res) => {
        const p = res.product;
        const badges = p.badges || [];
        // Calculate available stock = quantity - reserved
        const quantity = p.inventory?.quantity ?? 0;
        const reserved = p.inventory?.reserved ?? 0;
        const availableStock = Math.max(0, quantity - reserved);
        // Map nested DB structure → flat form fields
        this.product = {
          name: p.name || '',
          category: p.category?._id || p.category || '',
          price: p.pricing?.price ?? 0,
          originalPrice: p.pricing?.originalPrice ?? 0,
          stock: availableStock,
          sku: p.inventory?.sku || '',
          description: p.description || '',
          featured: p.featured || false,
          badgePromo: badges.includes('PROMO'),
          badgeNew: badges.includes('NEW'),
          badgeBestseller: badges.includes('BESTSELLER'),
          badgeExclusive: badges.includes('EXCLUSIVE'),
          badgeFreeShipping: badges.includes('FREE_SHIPPING'),
          badgeStockLimited: badges.includes('STOCK_LIMITED'),
          onSale: p.onSale || (p.saleEndsAt && new Date(p.saleEndsAt) > new Date()),
          saleEndsAt: p.saleEndsAt ? this.formatDateForInput(new Date(p.saleEndsAt)) : ''
        };
        // Store existing images for preview
        this.existingImages.set(p.media?.images || []);
        if (!silent) {
          this.loading.set(false);
        }
      },
      error: (err) => {
        if (!silent) {
          this.error.set(err.error?.message || 'Erreur lors du chargement du produit');
          this.loading.set(false);
        }
      }
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  onSaleDatePicked() {
    if (this.product.saleEndsAt && !this.product.onSale) {
      this.product.onSale = true;
    }
  }

  private formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  saveProduct() {
    this.saving.set(true);
    this.error.set('');
    
    if (!this.product.category) {
      this.error.set('Veuillez sélectionner une catégorie');
      this.saving.set(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', this.product.name);
    formData.append('description', this.product.description);
    formData.append('price', this.product.price.toString());
    formData.append('stock', this.product.stock.toString());
    formData.append('category', this.product.category);
    formData.append('featured', this.product.featured ? 'true' : 'false');
    
    if (this.product.originalPrice) {
      formData.append('originalPrice', this.product.originalPrice.toString());
    }
    if (this.product.sku) {
      formData.append('sku', this.product.sku);
    }

    // Build badges array
    const badges: string[] = [];
    if (this.product.badgePromo) badges.push('PROMO');
    if (this.product.badgeNew) badges.push('NEW');
    if (this.product.badgeBestseller) badges.push('BESTSELLER');
    if (this.product.badgeExclusive) badges.push('EXCLUSIVE');
    if (this.product.badgeFreeShipping) badges.push('FREE_SHIPPING');
    if (this.product.badgeStockLimited) badges.push('STOCK_LIMITED');
    formData.append('badges', JSON.stringify(badges));

    // Sale timer - send raw values from form
    formData.append('onSale', this.product.onSale ? 'true' : 'false');
    formData.append('saleEndsAt', this.product.saleEndsAt || '');

    this.selectedFiles().forEach(file => {
      formData.append('images', file);
    });

    const request = this.isEdit() 
      ? this.adminService.updateProduct(this.route.snapshot.params['id'], formData)
      : this.adminService.createProduct(formData);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        const msg = this.isEdit() ? 'Produit mis à jour avec succès!' : 'Produit créé avec succès!';
        this.toast.success('Succès', msg);
        setTimeout(() => {
          this.router.navigate(['/admin/products']);
        }, 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Erreur lors de l\'enregistrement');
      }
    });
  }
}