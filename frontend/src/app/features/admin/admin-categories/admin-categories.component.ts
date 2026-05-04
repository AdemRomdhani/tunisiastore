import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des catégories</h1>
          <p class="text-sm text-gray-500 mt-1">{{ categories().length }} catégories</p>
        </div>
        <button 
          (click)="toggleForm()"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition text-sm font-medium"
          [class.bg-gray-100]="showForm()"
          [class.text-gray-700]="showForm()"
          [class.hover:bg-gray-200]="showForm()"
          [class.bg-indigo-600]="!showForm()"
          [class.text-white]="!showForm()"
          [class.hover:bg-indigo-700]="!showForm()"
        >
          @if (showForm()) {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Fermer
          } @else {
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nouvelle catégorie
          }
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 class="text-lg font-bold mb-4 text-gray-900">
            {{ editingCategory() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
          </h2>
          <form (ngSubmit)="saveCategory()" class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input 
                type="text" 
                [(ngModel)]="categoryForm.name" 
                name="name" 
                required 
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Nom de la catégorie"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input 
                type="text" 
                [(ngModel)]="categoryForm.slug" 
                name="slug" 
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="auto-generer si vide"
              >
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                [(ngModel)]="categoryForm.description" 
                name="description" 
                rows="2" 
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                placeholder="Description optionnelle"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
              <input 
                type="number" 
                [(ngModel)]="categoryForm.order" 
                name="order" 
                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
            </div>
            <div class="flex items-end gap-3">
              <button 
                type="submit" 
                [disabled]="saving() || !categoryForm.name"
                class="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                @if (saving()) {
                  Enregistrement...
                } @else {
                  {{ editingCategory() ? 'Modifier' : 'Ajouter' }}
                }
              </button>
              @if (editingCategory()) {
                <button 
                  type="button" 
                  (click)="cancelEdit()"
                  class="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Annuler
                </button>
              }
            </div>
          </form>
        </div>
      }

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (categories().length === 0) {
          <app-empty-state 
            title="Aucune catégorie" 
            description="Commencez par créer votre première catégorie."
            icon="category"
          />
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordre</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (cat of categories(); track cat._id) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                        </svg>
                      </div>
                      <span class="font-medium text-gray-900">{{ cat.name }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-gray-500 font-mono text-xs">{{ cat.slug }}</td>
                  <td class="px-6 py-4 text-gray-500 max-w-xs truncate">{{ cat.description || '-' }}</td>
                  <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">{{ cat.order }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <button 
                        (click)="editCategory(cat)" 
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Modifier"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button 
                        (click)="openDeleteConfirm(cat._id)" 
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
        }
      </div>
    </div>

    <app-confirm-dialog
      [isOpen]="confirmDialogOpen"
      title="Supprimer la catégorie"
      message="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible."
      confirmText="Supprimer"
      confirmClass="bg-red-600"
      (confirmed)="confirmDelete()"
      (cancelled)="confirmDialogOpen = false"
    />
  `
})
export class AdminCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  categories = signal<Category[]>([]);
  showForm = signal(false);
  saving = signal(false);
  editingCategory = signal<string | null>(null);
  
  confirmDialogOpen = false;
  categoryToDelete: string | null = null;

  categoryForm = {
    name: '',
    slug: '',
    description: '',
    order: 0
  };

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => this.categories.set(res.categories)
    });
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  saveCategory() {
    if (!this.categoryForm.name) return;
    
    this.saving.set(true);
    
    const data = {
      ...this.categoryForm,
      slug: this.categoryForm.slug || undefined
    };

    const request = this.editingCategory()
      ? this.categoryService.updateCategory(this.editingCategory()!, data)
      : this.categoryService.createCategory(data);

    request.subscribe({
      next: () => {
        this.toast.success('Succès', `Catégorie ${this.editingCategory() ? 'modifiée' : 'ajoutée'} avec succès`);
        this.saving.set(false);
        this.showForm.set(false);
        this.resetForm();
        this.loadCategories();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de sauvegarder');
        this.saving.set(false);
      }
    });
  }

  editCategory(cat: Category) {
    this.editingCategory.set(cat._id);
    this.categoryForm = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      order: cat.order
    };
    this.showForm.set(true);
  }

  openDeleteConfirm(id: string) {
    this.categoryToDelete = id;
    this.confirmDialogOpen = true;
  }

  confirmDelete() {
    if (!this.categoryToDelete) return;
    
    this.categoryService.deleteCategory(this.categoryToDelete).subscribe({
      next: () => {
        this.toast.success('Succès', 'Catégorie supprimée');
        this.confirmDialogOpen = false;
        this.loadCategories();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Impossible de supprimer');
        this.confirmDialogOpen = false;
      }
    });
  }

  cancelEdit() {
    this.resetForm();
    this.showForm.set(false);
  }

  private resetForm() {
    this.categoryForm = { name: '', slug: '', description: '', order: 0 };
    this.editingCategory.set(null);
  }
}