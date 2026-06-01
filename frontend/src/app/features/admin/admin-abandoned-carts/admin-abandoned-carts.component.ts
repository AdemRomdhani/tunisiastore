import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-abandoned-carts',
  standalone: true,
  imports: [CommonModule, PaginationComponent, TranslatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">{{ 'admin.abandonedCarts' | t }}</h1>
        <button (click)="loadStats()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          {{ 'common.refresh' | t }}
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">{{ 'admin.abandonedCount' | t }}</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats()?.abandonedCount || 0 }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">{{ 'admin.recoveredCount' | t }}</p>
          <p class="text-2xl font-bold text-green-600">{{ stats()?.recoveredCount || 0 }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">{{ 'admin.recoveryRate' | t }}</p>
          <p class="text-2xl font-bold text-blue-600">{{ stats()?.recoveryRate || 0 }}%</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <p class="text-sm text-gray-500">{{ 'admin.totalValue' | t }}</p>
          <p class="text-2xl font-bold text-orange-600">{{ stats()?.totalValue || 0 }} DT</p>
        </div>
      </div>

      <!-- Carts Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-gray-500">
            <svg class="w-8 h-8 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ 'common.loading' | t }}
          </div>
        } @else if (carts().length === 0) {
          <div class="p-8 text-center text-gray-500">
            {{ 'admin.noAbandonedCarts' | t }}
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'admin.customer' | t }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'admin.items' | t }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'admin.total' | t }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'admin.lastActivity' | t }}</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ 'admin.status' | t }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (cart of carts(); track cart._id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      @if (cart.user) {
                        <div>
                          <p class="font-medium text-gray-900">{{ cart.user.firstName }} {{ cart.user.lastName }}</p>
                          <p class="text-sm text-gray-500">{{ cart.user.email }}</p>
                          <p class="text-sm text-gray-500">{{ cart.user.phone }}</p>
                        </div>
                      } @else if (cart.guestEmail) {
                        <div>
                          <p class="font-medium text-gray-900">{{ cart.guestEmail }}</p>
                          <p class="text-sm text-gray-500">{{ 'admin.guest' | t }}</p>
                        </div>
                      } @else if (cart.guestPhone) {
                        <div>
                          <p class="font-medium text-gray-900">{{ cart.guestPhone }}</p>
                          <p class="text-sm text-gray-500">{{ 'admin.guest' | t }}</p>
                        </div>
                      } @else {
                        <span class="text-gray-500">{{ 'admin.unknown' | t }}</span>
                      }
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-wrap gap-1">
                        @for (item of cart.items; track item._id) {
                          @if (item.product) {
                            <span class="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs">
                              {{ item.product.name }}
                              <span class="ml-1 text-gray-500">x{{ item.quantity }}</span>
                            </span>
                          }
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="font-medium text-gray-900">
                        {{ getCartTotal(cart) | number:'1.2-2' }} DT
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-sm text-gray-500">
                        {{ cart.lastModified | date:'dd/MM/yyyy HH:mm' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      @if (cart.isRecovered) {
                        <span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {{ 'admin.recovered' | t }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {{ 'admin.pending' | t }}
                        </span>
                      }
                      @if (cart.reminderCount > 0) {
                        <span class="ml-2 text-xs text-gray-500">
                          ({{ cart.reminderCount }} {{ 'admin.reminders' | t }})
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (pagination().total > 20) {
        <app-pagination
          [total]="pagination().total"
          [pageSize]="20"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `
})
export class AdminAbandonedCartsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private apiUrl = `${environment.apiUrl}`;

  loading = signal(false);
  carts = signal<any[]>([]);
  stats = signal<any>(null);
  pagination = signal({ current: 1, pages: 1, total: 0 });

  ngOnInit() {
    this.loadStats();
    this.loadCarts();
  }

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/admin/abandoned-carts/stats`).subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.set(res.stats);
        }
      },
      error: () => this.toast.error('Failed to load stats')
    });
  }

  loadCarts(page = 1) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/admin/abandoned-carts?page=${page}&limit=20`).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.carts.set(res.carts);
          this.pagination.set(res.pagination);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load carts');
      }
    });
  }

  onPageChange(page: number) {
    this.loadCarts(page);
  }

  getCartTotal(cart: any): number {
    if (!cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total: number, item: any) => {
      const price = item.product?.pricing?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }
}