import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuditService, AuditLog, AuditLogsResponse, AuditStats } from '../../../core/services/audit.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Suivre les actions</h1>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Aujourd'hui</p>
              <p class="text-xl font-bold text-gray-900">{{ stats()?.todayActions || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total actions</p>
              <p class="text-xl font-bold text-gray-900">{{ stats()?.totalActions || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.768-.293-1.536-.78-2.108l-4.432-4.332M7 20v-2c0-.768.293-1.536.78-2.108l4.432-4.332M7 20H5a2 2 0 00-2 2v2m6 0h6m-6 0v2a2 2 0 002 2h2"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Admins actifs</p>
              <p class="text-xl font-bold text-gray-900">{{ stats()?.recentAdmins?.length || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">Actions (7 jours)</p>
              <p class="text-xl font-bold text-gray-900">{{ stats()?.byAction?.['CREATE'] || 0 }}</p>
            </div>
          </div>
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
                placeholder="Rechercher par admin, description..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
            </div>
          </div>
          <select
            [(ngModel)]="filterAction"
            (ngModelChange)="loadLogs()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Toutes les actions</option>
            <option value="CREATE">Création</option>
            <option value="UPDATE">Modification</option>
            <option value="DELETE">Suppression</option>
            <option value="LOGIN">Connexion</option>
            <option value="LOGOUT">Déconnexion</option>
          </select>
          <select
            [(ngModel)]="filterResource"
            (ngModelChange)="loadLogs()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Toutes les ressources</option>
            <option value="PRODUCT">Produit</option>
            <option value="ORDER">Commande</option>
            <option value="USER">Utilisateur</option>
            <option value="CATEGORY">Catégorie</option>
            <option value="COUPON">Coupon</option>
            <option value="CONTACT">Message</option>
            <option value="RETURN">Retour</option>
            <option value="BUNDLE">Bundle</option>
            <option value="AUTH">Authentification</option>
          </select>
          <input
            type="date"
            [(ngModel)]="startDate"
            (ngModelChange)="loadLogs()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
          <input
            type="date"
            [(ngModel)]="endDate"
            (ngModelChange)="loadLogs()"
            class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-500">Chargement...</div>
        } @else if (logs().length === 0) {
          <app-empty-state
            title="Aucune action"
            description="Aucune action n'a été enregistrée."
            icon="default"
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Admin</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ressource</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (log of logs(); track log._id) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-6 py-4">
                      <div>
                        <p class="font-medium text-gray-900">{{ log.adminName }}</p>
                        <p class="text-xs text-gray-500">{{ log.adminEmail }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span 
                        class="px-2 py-1 text-xs font-medium rounded"
                        [class]="getActionClass(log.action)"
                      >
                        {{ getActionLabel(log.action) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        {{ getResourceLabel(log.resource) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {{ log.description }}
                    </td>
                    <td class="px-6 py-4 text-gray-500 text-xs">
                      {{ log.ipAddress || '-' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          
          @if (pagination()) {
            <div class="px-6 py-4 border-t border-gray-100">
              <app-pagination
                [pageSize]="pagination()!.limit"
                [total]="pagination()!.total"
                [currentPage]="pagination()!.page"
                (pageChange)="onPageChange($event)"
              />
            </div>
          }
        }
      </div>
    </div>
  `
})
export class AdminAuditLogsComponent implements OnInit, OnDestroy {
  private auditService = inject(AuditService);

  loading = signal(false);
  logs = signal<AuditLog[]>([]);
  pagination = signal<{ page: number; limit: number; total: number; pages: number } | null>(null);
  stats = signal<AuditStats | null>(null);

  searchTerm = '';
  filterAction = '';
  filterResource = '';
  startDate = '';
  endDate = '';
  currentPage = 1;
  limit = 20;

  ngOnInit() {
    this.loadStats();
    this.loadLogs();
  }

  ngOnDestroy() {}

  loadStats() {
    this.auditService.getAuditStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.set(res.stats);
        }
      },
      error: () => {}
    });
  }

  loadLogs() {
    this.loading.set(true);
    this.auditService.getAuditLogs({
      page: this.currentPage,
      limit: this.limit,
      action: this.filterAction || undefined,
      resource: this.filterResource || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      search: this.searchTerm || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.logs.set(res.logs);
          this.pagination.set(res.pagination);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadLogs();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadLogs();
  }

  getActionClass(action: string): string {
    const classes: { [key: string]: string } = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700'
    };
    return classes[action] || 'bg-gray-100 text-gray-700';
  }

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      CREATE: 'Création',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
      LOGIN: 'Connexion',
      LOGOUT: 'Déconnexion'
    };
    return labels[action] || action;
  }

  getResourceLabel(resource: string): string {
    const labels: { [key: string]: string } = {
      PRODUCT: 'Produit',
      ORDER: 'Commande',
      USER: 'Utilisateur',
      CATEGORY: 'Catégorie',
      COUPON: 'Coupon',
      CONTACT: 'Message',
      RETURN: 'Retour',
      NEWSLETTER: 'Newsletter',
      CMS: 'Page FAQ',
      BUNDLE: 'Bundle',
      AUTH: 'Authentification',
      OTHER: 'Autre'
    };
    return labels[resource] || resource;
  }
}