import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Abonnés newsletter</h1>
        <div class="text-sm text-gray-500">
          Total: <span class="font-semibold text-gray-900">{{ subscribers().length }}</span> abonnés
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="text-2xl font-bold text-indigo-600">{{ totalCount() }}</div>
          <div class="text-sm text-gray-500">Total abonnés</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="text-2xl font-bold text-green-600">{{ activeCount() }}</div>
          <div class="text-sm text-gray-500">Actifs</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="text-2xl font-bold text-gray-400">{{ inactiveCount() }}</div>
          <div class="text-sm text-gray-500">Désabonnés</div>
        </div>
      </div>

      <!-- Search -->
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
                placeholder="Rechercher un email..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
            </div>
          </div>
          <button (click)="loadSubscribers()" class="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm flex items-center gap-1">
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
        } @else if (filteredSubscribers().length === 0) {
          <app-empty-state
            title="Aucun abonnés"
            description="Aucun abonné à la newsletter pour le moment."
            icon="default"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Abonné le</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Désabonné le</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (sub of filteredSubscribers(); track sub._id) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4">
                      <span class="font-medium text-gray-900">{{ sub.email }}</span>
                    </td>
                    <td class="px-6 py-4">
                      @if (sub.isActive) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Actif
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Désabonné
                        </span>
                      }
                    </td>
                    <td class="px-6 py-4 text-gray-600">
                      {{ sub.subscribedAt | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-6 py-4 text-gray-500">
                      {{ sub.unsubscribedAt ? (sub.unsubscribedAt | date:'dd/MM/yyyy HH:mm') : '-' }}
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
  `
})
export class AdminNewsletterComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  allSubscribers: any[] = [];
  subscribers = signal<any[]>([]);
  filteredSubscribers = signal<any[]>([]);
  loading = signal(false);
  searchTerm = '';

  currentPage = 1;
  pageSize = 20;
  pagination = signal<{ current: number; pages: number; total: number }>({ current: 1, pages: 1, total: 0 });

  totalCount() {
    return this.pagination().total;
  }

  activeCount() {
    return this.allSubscribers.filter(s => s.isActive).length;
  }

  inactiveCount() {
    return this.allSubscribers.filter(s => !s.isActive).length;
  }

  ngOnInit() {
    this.loadSubscribers();
  }

  loadSubscribers() {
    this.loading.set(true);
    this.adminService.getNewsletterSubscribers({ page: this.currentPage, limit: this.pageSize }).subscribe({
      next: (res) => {
        this.allSubscribers = res.subscribers || [];
        this.subscribers.set(res.subscribers || []);
        this.pagination.set(res.pagination);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les abonnés');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.applyFilter();
  }

  applyFilter() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredSubscribers.set(this.allSubscribers.filter(s => s.email.toLowerCase().includes(term)));
    } else {
      this.filteredSubscribers.set(this.allSubscribers);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadSubscribers();
  }
}