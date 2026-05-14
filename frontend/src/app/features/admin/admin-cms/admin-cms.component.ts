import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Pages & FAQ</h1>
        <button 
          (click)="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter une page
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex gap-8">
          <button 
            (click)="activeTab = 'pages'"
            class="py-4 px-1 border-b-2 font-medium text-sm"
            [class.border-indigo-600]="activeTab === 'pages'"
            [class.text-indigo-600]="activeTab === 'pages'"
            [class.border-transparent]="activeTab !== 'pages'"
            [class.text-gray-500]="activeTab !== 'pages'"
          >
            Pages ({{ pages().length }})
          </button>
          <button 
            (click)="activeTab = 'faqs'"
            class="py-4 px-1 border-b-2 font-medium text-sm"
            [class.border-indigo-600]="activeTab === 'faqs'"
            [class.text-indigo-600]="activeTab === 'faqs'"
            [class.border-transparent]="activeTab !== 'faqs'"
            [class.text-gray-500]="activeTab !== 'faqs'"
          >
            FAQ ({{ faqs().length }})
          </button>
        </nav>
      </div>

      <!-- Pages -->
      @if (activeTab === 'pages') {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          @if (loading()) {
            <div class="p-8 text-center text-gray-500">Chargement...</div>
          } @else if (pages().length === 0) {
            <app-empty-state
              title="Aucune page"
              description="Commencez par créer votre première page."
              icon="default"
            />
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Titre</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (page of pages(); track page._id) {
                    <tr class="hover:bg-gray-50 transition">
                      <td class="px-6 py-4 font-medium text-gray-900">{{ page.title }}</td>
                      <td class="px-6 py-4 text-gray-500 font-mono text-xs">{{ page.slug }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 bg-gray-100 rounded text-xs">{{ page.type }}</span>
                      </td>
                      <td class="px-6 py-4">
                        @if (page.isActive) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Publiée
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Brouillon
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <button
                            (click)="openModal(page)"
                            class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                          <button
                            (click)="confirmDelete(page)"
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
          }
        </div>
      }

      <!-- FAQs -->
      @if (activeTab === 'faqs') {
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          @if (loading()) {
            <div class="p-8 text-center text-gray-500">Chargement...</div>
          } @else if (faqs().length === 0) {
            <app-empty-state
              title="Aucune FAQ"
              description="Commencez par créer vos questions fréquentes."
              icon="default"
            />
          } @else {
            <div class="divide-y divide-gray-100">
              @for (faq of faqs(); track faq._id) {
                <div class="p-4 hover:bg-gray-50">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <h3 class="font-medium text-gray-900">{{ faq.title }}</h3>
                      <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ faq.content }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        (click)="openFaqModal(faq)"
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Modifier"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        (click)="confirmDeleteFaq(faq)"
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Page Modal -->
    @if (modalOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="modalOpen = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingPage ? 'Modifier la page' : 'Ajouter une page' }}</h3>
            <form class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input 
                  type="text" 
                  [(ngModel)]="pageForm.title" 
                  name="title" 
                  required
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input 
                  type="text" 
                  [(ngModel)]="pageForm.slug" 
                  name="slug" 
                  required
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="page-url"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  [(ngModel)]="pageForm.type" 
                  name="type" 
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="PAGE">Page</option>
                  <option value="FAQ">FAQ</option>
                  <option value="POLICY">Politique</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                <textarea 
                  [(ngModel)]="pageForm.content" 
                  name="content"
                  rows="6"
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                <input 
                  type="number" 
                  [(ngModel)]="pageForm.order" 
                  name="order"
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
              </div>
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  [(ngModel)]="pageForm.isActive" 
                  name="isActive"
                  class="w-4 h-4 text-indigo-600 rounded border-gray-300"
                >
                <label class="text-sm text-gray-700">Page publiée</label>
              </div>
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  [(ngModel)]="pageForm.showInFooter" 
                  name="showInFooter"
                  class="w-4 h-4 text-indigo-600 rounded border-gray-300"
                >
                <label class="text-sm text-gray-700">Afficher dans le footer</label>
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
              (click)="savePage()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              {{ editingPage ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- FAQ Modal -->
    @if (faqModalOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="faqModalOpen = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingFaq ? 'Modifier la FAQ' : 'Ajouter une FAQ' }}</h3>
            <form class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input 
                  type="text" 
                  [(ngModel)]="faqForm.title" 
                  name="faqTitle" 
                  required
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Réponse *</label>
                <textarea 
                  [(ngModel)]="faqForm.content" 
                  name="faqContent"
                  rows="4"
                  required
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                <input 
                  type="number" 
                  [(ngModel)]="faqForm.order" 
                  name="faqOrder"
                  class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
              </div>
            </form>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <button 
              (click)="faqModalOpen = false"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Annuler
            </button>
            <button 
              (click)="saveFaq()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              {{ editingFaq ? 'Mettre à jour' : 'Créer' }}
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
export class AdminCmsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  pages = signal<any[]>([]);
  faqs = signal<any[]>([]);
  loading = signal(false);
  activeTab: 'pages' | 'faqs' = 'pages';

  modalOpen = false;
  faqModalOpen = false;
  editingPage: any = null;
  editingFaq: any = null;

  pageForm: any = { title: '', slug: '', type: 'PAGE', content: '', order: 0, isActive: true, showInFooter: false };
  faqForm: any = { title: '', content: '', order: 0 };

  confirmDialogOpen = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogConfirmClass = '';
  pendingAction: 'deletePage' | 'deleteFaq' | null = null;
  selectedItem: any = null;

  ngOnInit() {
    this.loadPages();
    this.loadFaqs();
  }

  loadPages() {
    this.loading.set(true);
    this.adminService.getCmsPages().subscribe({
      next: (res) => {
        this.pages.set(res.pages?.filter((p: any) => p.type !== 'FAQ') || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadFaqs() {
    this.adminService.getFaqs().subscribe({
      next: (res) => {
        this.faqs.set(res.faqs || []);
      },
      error: () => {}
    });
  }

  openModal(page?: any) {
    if (page) {
      this.editingPage = page;
      this.pageForm = {
        title: page.title,
        slug: page.slug,
        type: page.type,
        content: page.content || '',
        order: page.order || 0,
        isActive: page.isActive,
        showInFooter: page.showInFooter || false
      };
    } else {
      this.editingPage = null;
      this.pageForm = { title: '', slug: '', type: 'PAGE', content: '', order: 0, isActive: true, showInFooter: false };
    }
    this.modalOpen = true;
  }

  openFaqModal(faq?: any) {
    if (faq) {
      this.editingFaq = faq;
      this.faqForm = { title: faq.title, content: faq.content, order: faq.order || 0 };
    } else {
      this.editingFaq = null;
      this.faqForm = { title: '', content: '', order: 0 };
    }
    this.faqModalOpen = true;
  }

  savePage() {
    if (!this.pageForm.title || !this.pageForm.slug) {
      this.toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const request = this.editingPage
      ? this.adminService.updateCmsPage(this.editingPage._id, this.pageForm)
      : this.adminService.createCmsPage(this.pageForm);

    request.subscribe({
      next: () => {
        this.toast.success('Succès', this.editingPage ? 'Page mise à jour' : 'Page créée');
        this.modalOpen = false;
        this.loadPages();
      },
      error: (err) => {
        const msg = err.error?.message || 'Impossible de sauvegarder la page';
        this.toast.error('Erreur', msg);
      }
    });
  }

  saveFaq() {
    if (!this.faqForm.title || !this.faqForm.content) {
      this.toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const data = { ...this.faqForm, type: 'FAQ' };
    const request = this.editingFaq
      ? this.adminService.updateCmsPage(this.editingFaq._id, data)
      : this.adminService.createCmsPage(data);

    request.subscribe({
      next: () => {
        this.toast.success('Succès', this.editingFaq ? 'FAQ mise à jour' : 'FAQ créée');
        this.faqModalOpen = false;
        this.loadFaqs();
      },
      error: (err) => {
        const msg = err.error?.message || 'Impossible de sauvegarder la FAQ';
        this.toast.error('Erreur', msg);
      }
    });
  }

  confirmDelete(page: any) {
    this.selectedItem = page;
    this.pendingAction = 'deletePage';
    this.dialogTitle = 'Supprimer la page';
    this.dialogMessage = `Voulez-vous vraiment supprimer "${page.title}"?`;
    this.dialogConfirmText = 'Supprimer';
    this.dialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  confirmDeleteFaq(faq: any) {
    this.selectedItem = faq;
    this.pendingAction = 'deleteFaq';
    this.dialogTitle = 'Supprimer la FAQ';
    this.dialogMessage = `Voulez-vous vraiment supprimer cette FAQ?`;
    this.dialogConfirmText = 'Supprimer';
    this.dialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  confirmAction() {
    if (this.pendingAction === 'deletePage') {
      this.adminService.deleteCmsPage(this.selectedItem._id).subscribe({
        next: () => {
          this.toast.success('Succès', 'Page supprimée');
          this.confirmDialogOpen = false;
          this.loadPages();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de supprimer la page');
          this.confirmDialogOpen = false;
        }
      });
    } else if (this.pendingAction === 'deleteFaq') {
      this.adminService.deleteCmsPage(this.selectedItem._id).subscribe({
        next: () => {
          this.toast.success('Succès', 'FAQ supprimée');
          this.confirmDialogOpen = false;
          this.loadFaqs();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de supprimer la FAQ');
          this.confirmDialogOpen = false;
        }
      });
    }
  }
}