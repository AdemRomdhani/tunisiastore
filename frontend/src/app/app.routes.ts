import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent)
  },
  {
    path: 'product/:slug',
    loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'returns',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/returns/returns.component').then(m => m.ReturnsComponent)
  },
  {
    path: 'order/track',
    loadComponent: () => import('./features/orders/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent)
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/cms/faq-page/faq-page.component').then(m => m.FaqPageComponent)
  },
  {
    path: 'page/:slug',
    loadComponent: () => import('./features/cms/cms-page/cms-page.component').then(m => m.CmsPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'wishlist',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user/wishlist/wishlist.component').then(m => m.WishlistComponent)
  },
  {
    path: 'addresses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user/addresses/addresses.component').then(m => m.AddressesComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/products/compare/compare.component').then(m => m.CompareComponent)
  },
  {
    path: 'recently-viewed',
    loadComponent: () => import('./features/products/recently-viewed/recently-viewed.component').then(m => m.RecentlyViewedComponent)
  },
  {
    path: 'bundles',
    loadComponent: () => import('./features/products/bundles/bundles.component').then(m => m.BundlesComponent)
  },
  {
    path: 'payment',
    loadComponent: () => import('./features/payment/payment.component').then(m => m.PaymentComponent)
  },
  { path: '**', redirectTo: '' }
];