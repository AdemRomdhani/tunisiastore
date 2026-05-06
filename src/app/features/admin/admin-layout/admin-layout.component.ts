import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

interface Breadcrumb { label: string; path?: string; }
interface NavItem { label: string; path: string; icon: SafeHtml; }
interface OrderNotification { 
  _id: string; 
  orderNumber: string; 
  status: string; 
  createdAt: string; 
  total: number; 
  user?: { firstName: string; lastName: string; phone: string };
}

interface NotificationItem {
  id: string;
  type: 'order' | 'contact' | 'return' | 'stock' | 'user';
  title: string;
  subtitle: string;
  time?: string;
  link: string;
  badge?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  template: `
    <app-toast />
    
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Mobile Overlay -->
      @if (sidebarOpen()) {
        <div 
          class="fixed inset-0 bg-black/50 z-30 lg:hidden"
          (click)="toggleSidebar()"
        ></div>
      }
      
      <!-- Sidebar -->
      <aside 
        class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transform transition-transform duration-300 lg:translate-x-0"
        [ngClass]="{' -translate-x-full': !sidebarOpen(), 'translate-x-0': sidebarOpen()}"
      >
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="px-6 py-5 border-b border-gray-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-base font-bold text-white">Admin Panel</h1>
                <p class="text-xs text-gray-400">Tunisia Store</p>
              </div>
            </div>
          </div>
          
          <!-- Navigation -->
          <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            @for (item of filteredNavItems; track item.path) {
              <a 
                [routerLink]="item.path" 
                routerLinkActive="bg-indigo-600 text-white"
                [routerLinkActiveOptions]="{ exact: item.path === '/admin/dashboard' }"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                [class.text-gray-400]="!isActive(item.path)"
                [class.hover:bg-gray-800]="!isActive(item.path)"
                [class.text-white]="isActive(item.path)"
                [class.bg-indigo-600]="isActive(item.path)"
              >
                <span class="text-lg" [innerHTML]="item.icon"></span>
                {{ item.label }}
              </a>
            }
          </nav>
          
          <!-- Bottom Section -->
          <div class="px-4 py-4 border-t border-gray-800">
            <a 
              routerLink="/" 
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <span class="text-lg" [innerHTML]="externalIcon"></span>
              Voir le site
            </a>
            <button 
              (click)="logout()"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
            >
              <span class="text-lg" [innerHTML]="logoutIcon"></span>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 lg:ml-64" [class.pt-16]="stockAlerts().length > 0">
        <!-- Top Header -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div class="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
            <!-- Left: Mobile menu + Breadcrumbs -->
            <div class="flex items-center gap-2 lg:gap-4">
              <button 
                type="button"
                class="lg:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg touch-manipulation"
                (click)="toggleSidebar()"
                aria-label="Toggle menu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <nav class="flex items-center gap-2 text-sm">
                <span class="text-gray-400">Admin</span>
                @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
                  <span class="text-gray-400">/</span>
                  @if (last) {
                    <span class="font-medium text-gray-900">{{ crumb.label }}</span>
                  } @else {
                    <a [routerLink]="crumb.path" class="text-gray-500 hover:text-gray-700">{{ crumb.label }}</a>
                  }
                }
              </nav>
            </div>
            
            <!-- Right: User -->
            <div class="flex items-center gap-4">
              <!-- Notifications Dropdown -->
              <div class="relative">
                <button 
                  (click)="toggleNotifications()" 
                  class="relative p-2 text-gray-500 hover:text-gray-700 transition"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  @if (totalNotifications > 0) {
                    <span class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {{ totalNotifications > 9 ? '9+' : totalNotifications }}
                    </span>
                  }
                </button>
                @if (showNotifications()) {
                  <div class="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
                    <div class="p-3 border-b border-gray-100 flex justify-between items-center">
                      <h3 class="font-semibold text-gray-800">Notifications</h3>
                      <div class="flex items-center gap-2">
                        @if (totalNotifications > 0) {
                          <button 
                            (click)="clearNotifications(); $event.stopPropagation()"
                            class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Tout effacer
                          </button>
                        }
                        <span class="text-xs text-gray-500">{{ totalNotifications }} nouveaux</span>
                      </div>
                    </div>
                    
                    @if (notifications().length === 0 && recentOrders().length === 0) {
                      <div class="p-4 text-center text-gray-500">
                        Aucune notification
                      </div>
                    } @else {
                      @for (notif of notifications(); track notif.id) {
                        <a 
                          [routerLink]="notif.link" 
                          class="block p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center"
                              [class.bg-blue-100]="notif.type === 'contact'"
                              [class.bg-yellow-100]="notif.type === 'order'"
                              [class.bg-red-100]="notif.type === 'stock'"
                              [class.bg-orange-100]="notif.type === 'return'"
                              [class.bg-green-100]="notif.type === 'user'"
                            >
                              @switch (notif.type) {
                                @case ('contact') {
                                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                  </svg>
                                }
                                @case ('order') {
                                  <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                  </svg>
                                }
                                @case ('stock') {
                                  <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                  </svg>
                                }
                                @case ('return') {
                                  <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                                  </svg>
                                }
                                @case ('user') {
                                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                  </svg>
                                }
                              }
                            </div>
                            <div class="flex-1">
                              <p class="font-medium text-gray-800 text-sm">{{ notif.title }}</p>
                              <p class="text-xs text-gray-500">{{ notif.subtitle }}</p>
                            </div>
                          </div>
                        </a>
                      }
                      
                      @if (recentOrders().length > 0) {
                        <div class="p-2 border-b border-gray-100 bg-gray-50">
                          <p class="text-xs font-semibold text-gray-600">Commandes récentes</p>
                        </div>
                        @for (order of recentOrders(); track order._id) {
                          <a 
                            [routerLink]="'/admin/orders'" 
                            class="block p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div class="flex justify-between items-start">
                              <div>
                                <p class="font-medium text-gray-800 text-sm">{{ order.orderNumber }}</p>
                                <p class="text-xs text-gray-500">{{ order.user?.firstName }} {{ order.user?.lastName }}</p>
                              </div>
                              <span class="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                {{ order.status }}
                              </span>
                            </div>
                            <p class="text-sm font-semibold text-gray-900 mt-1">{{ order.total | number:'1.2-2' }} TND</p>
                          </a>
                        }
                      }
                    }
                  </div>
                }
              </div>
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span class="text-sm font-bold text-indigo-600">
                    {{ userInitials }}
                  </span>
                </div>
                <div class="hidden sm:block">
                  <p class="text-sm font-medium text-gray-900">{{ authService.currentUser()?.firstName }}</p>
                  <p class="text-xs text-gray-500">{{ authService.currentUser()?.email }}</p>
                </div>
                <a 
                  routerLink="/" 
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition ml-2"
                  title="Voir le site"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  <span class="hidden md:inline">Site</span>
                </a>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Page Content -->
        <div class="p-4 lg:p-6">
          <router-outlet/>
        </div>
      </main>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private adminService = inject(AdminService);

  breadcrumbs = signal<Breadcrumb[]>([]);
  stockAlerts = signal<{type: string, label: string, count: number}[]>([]);
  pendingOrdersCount = signal<number>(0);
  recentOrders = signal<OrderNotification[]>([]);
  unreadContactsCount = signal<number>(0);
  pendingReturnsCount = signal<number>(0);
  newUsersCount = signal<number>(0);
  stockAlertCount = signal<number>(0);
  lastAcknowledgedCounts = signal<{orders: number, contacts: number, returns: number, users: number, stock: number}>({orders: 0, contacts: 0, returns: 0, users: 0, stock: 0});
  notifications = signal<NotificationItem[]>([]);
  showNotifications = signal<boolean>(false);
  sidebarOpen = signal<boolean>(false);
  private routerSubscription?: Subscription;
  private pollingInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {}

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  navItems: NavItem[] = [
    { label: 'Tableau de bord', path: '/admin/dashboard', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>') },
    { label: 'Produits', path: '/admin/products', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>') },
    { label: 'Bundles', path: '/admin/bundles', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6m14 0l-4-4m4 4l-4 4"/></svg>') },
    { label: 'Commandes', path: '/admin/orders', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>') },
    { label: 'Retours', path: '/admin/returns', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>') },
    { label: 'Catégories', path: '/admin/categories', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>') },
    { label: 'Utilisateurs', path: '/admin/users', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>') },
    { label: 'Messages', path: '/admin/contacts', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>') },
    { label: 'Coupons', path: '/admin/coupons', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/></svg>') },
    { label: 'Newsletter', path: '/admin/newsletter', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>') },
    { label: 'Pages & FAQ', path: '/admin/cms', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>') },
    { label: 'Suivre les actions', path: '/admin/audit-logs', icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>') },
  ];

  get filteredNavItems(): NavItem[] {
    const user = this.authService.currentUser();
    // Only supervisor can see "Utilisateurs" and "Suivre les actions"
    if (user?.role === 'supervisor') {
      return this.navItems;
    }
    // Admin and moderator CANNOT see these menus
    return this.navItems.filter(item => 
      item.path !== '/admin/audit-logs' && 
      item.path !== '/admin/users'
    );
  }

  logoutIcon = this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>');
  externalIcon = this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>');

  get userInitials(): string {
    const first = this.authService.currentUser()?.firstName?.[0] || '';
    const last = this.authService.currentUser()?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'A';
  }

  constructor() {
    this.routerSubscription = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumbs();
      this.loadAllNotifications();
    });
    this.updateBreadcrumbs();
    this.loadAllNotifications();
    this.startPolling();
  }

  private startPolling() {
    this.pollingInterval = setInterval(() => {
      this.loadAllNotifications();
    }, 30000);
  }

  toggleNotifications() {
    this.showNotifications.set(!this.showNotifications());
  }

  clearNotifications() {
    this.adminService.markAllContactsAsRead().subscribe();
    this.lastAcknowledgedCounts.set({
      orders: this.pendingOrdersCount(),
      contacts: this.unreadContactsCount(),
      returns: this.pendingReturnsCount(),
      users: this.newUsersCount(),
      stock: this.stockAlertCount()
    });
    this.notifications.set([]);
  }

  get totalNotifications(): number {
    return this.notifications().length;
  }

  private loadStockAlerts() {
    this.adminService.getLowStockProducts().subscribe({
      next: (res) => {
        const alerts: {type: string, label: string, count: number}[] = [];
        if (res.ruptureCount > 0) {
          alerts.push({ type: 'rupture', label: 'Rupture de stock', count: res.ruptureCount });
        }
        if (res.faibleCount > 0) {
          alerts.push({ type: 'faible', label: 'Stock faible', count: res.faibleCount });
        }
        this.stockAlerts.set(alerts);
      },
      error: () => {}
    });
  }

  private loadAllNotifications() {
    const notifs: NotificationItem[] = [];
    const acknowledged = this.lastAcknowledgedCounts();

    this.adminService.getPendingOrdersCount().subscribe({
      next: (res) => {
        const total = res.count || 0;
        const newCount = Math.max(0, total - acknowledged.orders);
        this.pendingOrdersCount.set(total);
        if (newCount > 0) {
          notifs.push({
            id: 'orders',
            type: 'order',
            title: `${newCount} nouvelle(s) commande(s)`,
            subtitle: total > 0 ? `${total} en attente` : 'Nécessite confirmation',
            link: '/admin/orders'
          });
        }
      },
      error: () => {}
    });

    this.adminService.getContacts({ limit: 1 }).subscribe({
      next: (res) => {
        const total = res.unreadCount || 0;
        const newCount = Math.max(0, total - acknowledged.contacts);
        this.unreadContactsCount.set(total);
        if (newCount > 0) {
          notifs.push({
            id: 'contacts',
            type: 'contact',
            title: `${newCount} nouveau(x) message(s)`,
            subtitle: total > 0 ? `${total} non lu(s)` : 'Messages de contact',
            link: '/admin/contacts'
          });
        }
      },
      error: () => {}
    });

    this.adminService.getReturns({ status: 'PENDING' }).subscribe({
      next: (res) => {
        const total = res.returns?.length || 0;
        const newCount = Math.max(0, total - acknowledged.returns);
        this.pendingReturnsCount.set(total);
        if (newCount > 0) {
          notifs.push({
            id: 'returns',
            type: 'return',
            title: `${newCount} nouveau(x) retour(s)`,
            subtitle: total > 0 ? `${total} en attente` : 'Demandes de retour',
            link: '/admin/returns'
          });
        }
      },
      error: () => {}
    });

    // Only supervisor can see user notifications
    if (this.authService.currentUser()?.role === 'supervisor') {
      this.adminService.getNewUsersCount().subscribe({
        next: (res) => {
          const total = res.count || 0;
          const newCount = Math.max(0, total - acknowledged.users);
          this.newUsersCount.set(total);
          if (newCount > 0) {
            notifs.push({
              id: 'users',
              type: 'user',
              title: `${newCount} nouveau(x) utilisateur(s)`,
              subtitle: total > 0 ? `${total} cette semaine` : 'Inscriptions récentes',
              link: '/admin/users'
            });
          }
        },
        error: () => {}
      });
    } else {
      this.newUsersCount.set(0);
    }

    this.adminService.getLowStockProducts().subscribe({
      next: (res) => {
        const totalAlertCount = (res.ruptureCount || 0) + (res.faibleCount || 0);
        const newAlerts = Math.max(0, totalAlertCount - acknowledged.stock);
        this.stockAlertCount.set(totalAlertCount);
        if (newAlerts > 0) {
          notifs.push({
            id: 'stock',
            type: 'stock',
            title: 'Alerte stock',
            subtitle: `${res.ruptureCount || 0} rupture, ${res.faibleCount || 0} faible`,
            link: '/admin/products'
          });
        }
      },
      error: () => {}
    });

    this.adminService.getRecentOrders(5).subscribe({
      next: (res) => {
        this.recentOrders.set(res.orders || []);
      },
      error: () => {}
    });

    this.notifications.set(notifs);
  }

  private loadPendingOrdersCount() {
    this.loadAllNotifications();
  }

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }

  private updateBreadcrumbs() {
    const url = this.router.url;
    const crumbs: Breadcrumb[] = [];
    
    if (url.includes('/dashboard')) crumbs.push({ label: 'Tableau de bord', path: '/admin/dashboard' });
    else if (url.includes('/products')) crumbs.push({ label: 'Produits', path: '/admin/products' });
    else if (url.includes('/orders')) crumbs.push({ label: 'Commandes', path: '/admin/orders' });
    else if (url.includes('/categories')) crumbs.push({ label: 'Catégories', path: '/admin/categories' });
    else if (url.includes('/users')) crumbs.push({ label: 'Utilisateurs', path: '/admin/users' });
    else if (url.includes('/contacts')) crumbs.push({ label: 'Messages', path: '/admin/contacts' });
    else if (url.includes('/coupons')) crumbs.push({ label: 'Coupons', path: '/admin/coupons' });
    else if (url.includes('/newsletter')) crumbs.push({ label: 'Newsletter', path: '/admin/newsletter' });
    else if (url.includes('/cms')) crumbs.push({ label: 'Pages & FAQ', path: '/admin/cms' });
    else if (url.includes('/audit-logs')) crumbs.push({ label: 'Suivre les actions', path: '/admin/audit-logs' });
    
    if (url.includes('/new') || url.includes('/edit')) {
      crumbs.push({ label: url.includes('/new') ? 'Nouveau' : 'Modifier' });
    }
    
    this.breadcrumbs.set(crumbs);
  }

  logout() {
    this.authService.logout();
  }
}