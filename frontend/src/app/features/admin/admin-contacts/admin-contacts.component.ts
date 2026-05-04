import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, EmptyStateComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Messages de contact</h1>
        @if (unreadCount() > 0) {
          <button 
            (click)="markAllAsRead()" 
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Tout marquer comme lu
          </button>
        }
      </div>

      @if (unreadCount() > 0) {
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span class="text-sm text-blue-700 font-medium">
            {{ unreadCount() }} message(s) non lu(s)
          </span>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm p-4">
        <div class="flex flex-wrap items-center gap-4">
          <select
            [(ngModel)]="filterRead"
            (ngModelChange)="loadContacts()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            <option value="">Tous les messages</option>
            <option value="false">Non lus</option>
            <option value="true">Lus</option>
          </select>
          <button (click)="loadContacts()" class="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm flex items-center gap-1">
            <svg class="w-4 h-4" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.003 8.003 0 0120 20v-5h.581m-16 0A8.003 8.003 0 004.582 12h5"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-500">Chargement...</div>
        } @else if (contacts().length === 0) {
          <app-empty-state
            title="Aucun message"
            description="Les messages de contact apparaîtront ici."
            icon="default"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sujet</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (contact of contacts(); track contact._id) {
                  <tr class="hover:bg-gray-50 transition" [class.bg-blue-50]="!contact.isRead">
                    <td class="px-6 py-4">
                      @if (!contact.isRead) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Nouveau
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Lu
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 font-medium text-gray-900">{{ contact.name }}</td>
                    <td class="px-6 py-4 text-gray-600">{{ contact.email }}</td>
                    <td class="px-6 py-4 text-gray-600">{{ contact.phone || '-' }}</td>
                    <td class="px-6 py-4 text-gray-900">{{ contact.subject }}</td>
                    <td class="px-6 py-4 text-gray-500 text-xs">{{ contact.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <button
                          (click)="viewContact(contact)"
                          class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Voir le message"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        @if (!contact.isRead) {
                          <button
                            (click)="markAsRead(contact)"
                            class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Marquer comme lu"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </button>
                        }
                        <button
                          (click)="confirmDelete(contact)"
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

    <!-- View Contact Modal -->
    @if (viewModalOpen && selectedContact) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="viewModalOpen = false">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Message de {{ selectedContact.name }}</h3>
              <button (click)="viewModalOpen = false" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex gap-2">
                <span class="text-gray-500">Email:</span>
                <span class="text-gray-900">{{ selectedContact.email }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500">Téléphone:</span>
                <span class="text-gray-900">{{ selectedContact.phone || '-' }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500">Sujet:</span>
                <span class="text-gray-900">{{ selectedContact.subject }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-gray-500">Date:</span>
                <span class="text-gray-900">{{ selectedContact.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ selectedContact.message }}</p>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
            <a 
              [href]="'mailto:' + selectedContact.email" 
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
            >
              Répondre par email
            </a>
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
export class AdminContactsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  contacts = signal<any[]>([]);
  loading = signal(false);
  unreadCount = signal(0);

  filterRead = '';
  currentPage = 1;
  pageSize = 10;

  pagination = signal<{ current: number; pages: number; total: number }>({ current: 1, pages: 1, total: 0 });

  viewModalOpen = false;
  selectedContact: any = null;

  confirmDialogOpen = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogConfirmText = '';
  dialogConfirmClass = '';
  pendingAction: 'delete' | null = null;

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.loading.set(true);
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (this.filterRead) params.read = this.filterRead;

    this.adminService.getContacts(params).subscribe({
      next: (res) => {
        this.contacts.set(res.contacts || []);
        this.unreadCount.set(res.unreadCount || 0);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les messages');
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadContacts();
  }

  viewContact(contact: any) {
    this.selectedContact = contact;
    this.viewModalOpen = true;
    if (!contact.isRead) {
      this.markAsRead(contact);
    }
  }

  markAsRead(contact: any) {
    this.adminService.markContactAsRead(contact._id).subscribe({
      next: () => {
        contact.isRead = true;
        this.unreadCount.update(c => Math.max(0, c - 1));
      }
    });
  }

  markAllAsRead() {
    this.adminService.markAllContactsAsRead().subscribe({
      next: () => {
        this.toast.success('Succès', 'Tous les messages marqués comme lus');
        this.loadContacts();
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de marquer comme lu');
      }
    });
  }

  confirmDelete(contact: any) {
    this.selectedContact = contact;
    this.pendingAction = 'delete';
    this.dialogTitle = 'Supprimer le message';
    this.dialogMessage = `Voulez-vous vraiment supprimer le message de ${contact.name}?`;
    this.dialogConfirmText = 'Supprimer';
    this.dialogConfirmClass = 'bg-red-600';
    this.confirmDialogOpen = true;
  }

  confirmAction() {
    if (this.pendingAction === 'delete') {
      this.adminService.deleteContact(this.selectedContact._id).subscribe({
        next: () => {
          this.toast.success('Succès', 'Message supprimé');
          this.confirmDialogOpen = false;
          this.loadContacts();
        },
        error: () => {
          this.toast.error('Erreur', 'Impossible de supprimer le message');
          this.confirmDialogOpen = false;
        }
      });
    }
  }
}