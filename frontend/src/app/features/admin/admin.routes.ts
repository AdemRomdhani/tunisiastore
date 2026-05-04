import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'products', loadComponent: () => import('./admin-products/admin-products.component').then(m => m.AdminProductsComponent) },
      { path: 'products/new', loadComponent: () => import('./admin-product-form/admin-product-form.component').then(m => m.AdminProductFormComponent) },
      { path: 'products/edit/:id', loadComponent: () => import('./admin-product-form/admin-product-form.component').then(m => m.AdminProductFormComponent) },
      { path: 'orders', loadComponent: () => import('./admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'returns', loadComponent: () => import('./admin-returns/admin-returns.component').then(m => m.AdminReturnsComponent) },
      { path: 'categories', loadComponent: () => import('./admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'bundles', loadComponent: () => import('./admin-bundles/admin-bundles.component').then(m => m.AdminBundlesComponent) },
      { path: 'users', loadComponent: () => import('./admin-users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'contacts', loadComponent: () => import('./admin-contacts/admin-contacts.component').then(m => m.AdminContactsComponent) },
      { path: 'coupons', loadComponent: () => import('./admin-coupons/admin-coupons.component').then(m => m.AdminCouponsComponent) },
      { path: 'newsletter', loadComponent: () => import('./admin-newsletter/admin-newsletter.component').then(m => m.AdminNewsletterComponent) },
      { path: 'cms', loadComponent: () => import('./admin-cms/admin-cms.component').then(m => m.AdminCmsComponent) },
      { path: 'audit-logs', loadComponent: () => import('./admin-audit-logs/admin-audit-logs.component').then(m => m.AdminAuditLogsComponent) }
    ]
  }
];