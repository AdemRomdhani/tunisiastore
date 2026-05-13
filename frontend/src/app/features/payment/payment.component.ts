import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-16 text-center min-h-screen">
      @if (loading()) {
        <div class="max-w-md mx-auto">
          <div class="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 class="text-2xl font-bold mb-2">{{ 'payment.processing' | t }}</h2>
          <p class="text-gray-500">{{ 'payment.pleaseWait' | t }}</p>
        </div>
} @else if (status() === 'success') {
        <div class="max-w-md mx-auto bg-green-50 border border-green-200 rounded-xl p-8">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-green-700 mb-2">{{ 'payment.success' | t }}</h2>
          <p class="text-gray-600 mb-2">{{ 'payment.successMessage' | t }}</p>
          <p class="text-sm text-gray-500 mb-6">{{ 'payment.orderNumber' | t }}: {{ orderNumber() }}</p>
          <a routerLink="/orders" class="btn-primary inline-block">{{ 'orders.viewDetails' | t }}</a>
        </div>
      } @else if (status() === 'failed') {
        <div class="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-red-700 mb-2">{{ 'payment.failed' | t }}</h2>
          <p class="text-gray-600 mb-6">{{ error() }}</p>
          <a routerLink="/checkout" class="btn-primary inline-block">{{ 'payment.tryAgain' | t }}</a>
        </div>
      } @else if (status() === 'cancelled') {
        <div class="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-yellow-700 mb-2">{{ 'payment.cancelled' | t }}</h2>
          <p class="text-gray-600 mb-6">{{ 'payment.cancelledMessage' | t }}</p>
          <a routerLink="/checkout" class="btn-primary inline-block">{{ 'common.back' | t }}</a>
        </div>
      } @else if (status() === 'failed') {
        <div class="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-red-700 mb-2">{{ 'payment.failed' | t }}</h2>
          <p class="text-gray-600 mb-6">{{ error() }}</p>
          <a routerLink="/checkout" class="btn-primary inline-block">{{ 'payment.tryAgain' | t }}</a>
        </div>
      }
    </div>
  `
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  loading = signal(true);
  error = signal('');
  status = signal<'loading' | 'success' | 'failed' | 'cancelled' | 'init'>('init');
  orderNumber = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.handleReturnStatus(params['status'], params['order']);
      } else if (params['orderId'] && params['method']) {
        this.initiatePayment(params['orderId'], params['method']);
      } else {
        this.error.set('Paramètres de paiement manquants');
        this.loading.set(false);
      }
    });
  }

  private handleReturnStatus(status: string, orderNumber?: string) {
    this.loading.set(false);
    if (orderNumber) this.orderNumber.set(orderNumber);
    
    switch (status) {
      case 'success':
        this.status.set('success');
        break;
      case 'failed':
        this.status.set('failed');
        this.error.set('Le paiement a échoué. Veuillez réessayer.');
        break;
      case 'cancelled':
        this.status.set('cancelled');
        break;
      default:
        this.error.set('Statut de paiement inconnu');
    }
  }

  initiatePayment(orderId: string, method: string) {
    this.http.post<{ success: boolean; paymentUrl: string; paymentRef: string }>(
      `${environment.apiUrl}/payments/initiate`,
      { orderId, method }
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          this.router.navigate(['/orders'], { 
            queryParams: { success: true, order: res.paymentRef } 
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erreur de paiement');
      }
    });
  }
}