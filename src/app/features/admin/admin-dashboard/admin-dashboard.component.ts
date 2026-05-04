import { Component, OnInit, inject, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Header with Quick Actions -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p class="text-sm text-gray-500 mt-1">Bienvenue, voici un aperçu de votre boutique</p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/admin/products/new" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nouveau produit
          </a>
          <a routerLink="/admin/orders" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            Voir les commandes
          </a>
        </div>
      </div>
      
      @if (loading()) {
        <app-skeleton type="stats"/>
      } @else if (stats()) {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500 hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Commandes totales</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats()?.totals?.orders || 0 }}</p>
                <div class="flex items-center gap-1 mt-2">
                  <span class="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <svg class="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                    </svg>
                    +{{ stats()?.periods?.ordersThisMonth || 0 }}
                  </span>
                  <span class="text-xs text-gray-400">ce mois</span>
                </div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-green-500 hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Revenus totaux</p>
                <p class="text-3xl font-bold text-green-600">{{ (stats()?.totals?.revenue || 0) | number:'1.3' }} DT</p>
                <div class="flex items-center gap-1 mt-2">
                  <span class="inline-flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <svg class="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                    </svg>
                    +{{ stats()?.periods?.monthlyRevenue || 0 }} DT
                  </span>
                  <span class="text-xs text-gray-400">ce mois</span>
                </div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-purple-500 hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Clients</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats()?.totals?.users || 0 }}</p>
                <p class="text-xs text-gray-400 mt-2">inscrits</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-orange-500 hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Produits</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats()?.totals?.products || 0 }}</p>
                @if (stats()?.alerts?.ruptureStock > 0) {
                  <p class="text-xs text-red-600 mt-2 font-medium">{{ stats()?.alerts?.ruptureStock }} rupture de stock</p>
                } @else if (stats()?.alerts?.lowStock > 0) {
                  <p class="text-xs text-orange-600 mt-2 font-medium">{{ stats()?.alerts?.lowStock }} en stock bas</p>
                }
              </div>
              <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold text-lg text-gray-900">Revenus mensuels</h3>
              <span class="text-xs text-gray-400">12 derniers mois</span>
            </div>
            <div class="h-64">
              <canvas #revenueChart></canvas>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-bold text-lg text-gray-900">Commandes quotidiennes</h3>
              <span class="text-xs text-gray-400">30 derniers jours</span>
            </div>
            <div class="h-64">
              <canvas #ordersChart></canvas>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <h3 class="font-bold text-lg text-gray-900 mb-6">Commandes par statut</h3>
            <div class="h-48">
              <canvas #statusChart></canvas>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <h3 class="font-bold text-lg text-gray-900 mb-6">Par governorat</h3>
            <div class="h-48">
              <canvas #governorateChart></canvas>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <h3 class="font-bold text-lg text-gray-900 mb-6">Meilleurs produits</h3>
            <div class="space-y-4">
              @for (item of stats()?.topProducts || []; track item.product?._id; let i = $index) {
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                    {{ i + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ item.product?.name || '—' }}</p>
                    <p class="text-xs text-gray-500">{{ item.totalSold || 0 }} ventes</p>
                  </div>
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-50">
                      @if (item.product?.media?.images?.[0]) {
                        <img [src]="item.product.media.images[0]" class="w-full h-full object-cover" width="40" height="40">
                      }
                    </div>
                  </div>
                </div>
              }
              @if ((stats()?.topProducts || []).length === 0) {
                <app-empty-state 
                  title="Aucune donnée" 
                  description="Les produits les plus vendus apparaîtront ici."
                  icon="products"
                />
              }
            </div>
          </div>
        </div>

        <!-- Alerts + Recent Orders Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Stock Alerts -->
          @if (ruptureProducts().length > 0 || faibleProducts().length > 0) {
            <div class="space-y-4">
              <!-- Rupture Stock Alert -->
              @if (ruptureProducts().length > 0) {
                <div class="bg-red-50 border border-red-300 rounded-xl p-5">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-bold text-red-800">Rupture de stock</h3>
                      <p class="text-sm text-red-600">{{ ruptureProducts().length }} produits épuisés</p>
                    </div>
                  </div>
                  <div class="space-y-2 max-h-32 overflow-y-auto">
                    @for (product of ruptureProducts(); track product._id) {
                      <div class="flex items-center justify-between bg-white rounded-lg p-2 px-3">
                        <span class="font-medium text-gray-800 text-sm truncate">{{ product.name }}</span>
                        <span class="font-bold text-red-600 text-sm flex-shrink-0 ml-2">0</span>
                      </div>
                    }
                  </div>
                </div>
              }
              
              <!-- Faible Stock Alert -->
              @if (faibleProducts().length > 0) {
                <div class="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-bold text-orange-800">Stock faible</h3>
                      <p class="text-sm text-orange-600">{{ faibleProducts().length }} produits à approvisionner</p>
                    </div>
                  </div>
                  <div class="space-y-2 max-h-32 overflow-y-auto">
                    @for (product of faibleProducts(); track product._id) {
                      <div class="flex items-center justify-between bg-white rounded-lg p-2 px-3">
                        <span class="font-medium text-gray-800 text-sm truncate">{{ product.name }}</span>
                        <span class="font-bold text-orange-600 text-sm flex-shrink-0 ml-2">{{ product.inventory?.quantity || 0 }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Recent Orders -->
          <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-gray-900">Commandes récentes</h3>
              <a routerLink="/admin/orders" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                Voir toutes
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
            <div class="space-y-3">
              @for (order of stats()?.recentOrders || []; track order._id) {
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {{ (order.user?.firstName || order.shippingAddress?.fullName || '?')[0] | uppercase }}
                    </div>
                    <div>
                      <div class="font-medium text-gray-800 text-sm">{{ order.user?.firstName || order.shippingAddress?.fullName || '—' }}</div>
                      <div class="text-xs text-gray-400">{{ order.orderNumber || '—' }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-gray-800">{{ order.pricing?.total | number:'1.3' }} DT</div>
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="getStatusClass(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="text-center py-12">
          <p class="text-gray-400">Impossible de charger les statistiques</p>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('governorateChart') governorateChartRef!: ElementRef<HTMLCanvasElement>;

  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  
  stats = signal<any>(null);
  lowStockProducts = signal<any[]>([]);
  ruptureProducts = signal<any[]>([]);
  faibleProducts = signal<any[]>([]);
  ruptureCount = signal(0);
  faibleCount = signal(0);
  chartData = signal<any>(null);
  loading = signal(true);
  
  private charts: Chart[] = [];
  private chartsLoaded = false;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.stats);
        this.chartData.set(res.stats);
        this.loading.set(false);
        setTimeout(() => this.initCharts(), 100);
      },
      error: () => {
        this.toast.error('Erreur', 'Impossible de charger les statistiques');
        this.loading.set(false);
      }
    });
    
    this.adminService.getLowStockProducts().subscribe({
      next: (res) => {
        this.lowStockProducts.set(res.products || []);
        this.ruptureProducts.set(res.ruptureProducts || []);
        this.faibleProducts.set(res.faibleProducts || []);
        this.ruptureCount.set(res.ruptureCount || 0);
        this.faibleCount.set(res.faibleCount || 0);
      }
    });
    
    this.adminService.getCharts().subscribe({
      next: (res) => {
        if (res.success && res.chartData) {
          this.chartData.set(res.chartData);
          setTimeout(() => this.initCharts(), 100);
        }
      },
      error: () => console.error('Chart error')
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.chartData() && !this.chartsLoaded) {
        this.initCharts();
      }
    }, 1500);
  }

  private initCharts() {
    const data = this.chartData();
    if (!data || this.chartsLoaded) return;
    this.chartsLoaded = true;
    
    this.destroyCharts();
    
    if (this.revenueChartRef?.nativeElement) {
      this.createRevenueChart(data.monthlyRevenue);
    }
    if (this.ordersChartRef?.nativeElement) {
      this.createOrdersChart(data.dailyOrders);
    }
    if (this.statusChartRef?.nativeElement) {
      this.createStatusChart(data.ordersByStatus);
    }
    if (this.governorateChartRef?.nativeElement) {
      this.createGovernorateChart(data.ordersByGovernorate);
    }
  }

  private createRevenueChart(data: any) {
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    let labels: string[] = [];
    let values: number[] = [];
    
    if (data && data.length > 0) {
      labels = data.map((d: any) => {
        const [year, month] = d._id.split('-');
        return monthNames[parseInt(month) - 1] + ' ' + year.slice(2);
      });
      values = data.map((d: any) => d.revenue);
    } else {
      labels = monthNames;
      values = monthNames.map(() => 0);
    }
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Revenus (DT)',
          data: values,
          backgroundColor: '#22c55e',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private createOrdersChart(data: any) {
    const ctx = this.ordersChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    let labels: string[] = [];
    let values: number[] = [];
    
    if (data && data.length > 0) {
      labels = data.map((d: any) => d._id);
      values = data.map((d: any) => d.orders);
    } else {
      labels = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      });
      values = labels.map(() => 0);
    }
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Commandes',
          data: values,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private createStatusChart(data: any) {
    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    let labels: string[] = [];
    let values: number[] = [];
    const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e', '#ef4444'];
    
    if (data && Object.keys(data).length > 0) {
      labels = Object.keys(data).map(s => this.getStatusLabel(s));
      values = Object.values(data) as number[];
    } else {
      labels = ['En attente', 'Confirmée', 'Préparation', 'Expédiée', 'Livrée', 'Annulée'];
      values = [0, 0, 0, 0, 0, 0];
    }
    
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) {
      values = [1];
      colors[0] = '#e5e7eb';
    }
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, values.length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  private createGovernorateChart(data: any) {
    const ctx = this.governorateChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    let labels: string[] = [];
    let values: number[] = [];
    
    if (data && data.length > 0) {
      labels = data.map((g: any) => g._id || 'N/A');
      values = data.map((g: any) => g.count);
    } else {
      labels = ['Tunis', 'Ariana', 'Sousse', 'Nabeul', 'Bizerte', 'Gabes'];
      values = [0, 0, 0, 0, 0, 0];
    }
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.slice(0, 6),
        datasets: [{
          label: 'Commandes',
          data: values.slice(0, 6),
          backgroundColor: '#f97316',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f3f4f6' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'Préparation', SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée' };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = { PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-indigo-100 text-indigo-700', SHIPPED: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700', REFUNDED: 'bg-gray-100 text-gray-600' };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }
}