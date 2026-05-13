import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div class="max-w-md w-full text-center">
        @if (loading()) {
          <div class="bg-white rounded-xl shadow-sm p-8">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p class="text-gray-600">{{ 'verifyEmail.verifying' | t }}</p>
          </div>
        } @else if (success()) {
          <div class="bg-white rounded-xl shadow-sm p-8">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-green-600 mb-2">{{ 'verifyEmail.verified' | t }}</h1>
            <p class="text-gray-600 mb-6">{{ 'verifyEmail.successMessage' | t }}</p>
            <button (click)="goHome()" class="btn-primary">
              {{ 'verifyEmail.goHome' | t }}
            </button>
          </div>
        } @else {
          <div class="bg-white rounded-xl shadow-sm p-8">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-red-600 mb-2">{{ 'common.error' | t }}</h1>
            <p class="text-gray-600 mb-6">{{ error() }}</p>
            <button (click)="goHome()" class="btn-primary">
              {{ 'verifyEmail.goHome' | t }}
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/auth`;

  loading = signal(true);
  success = signal(false);
  error = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.loading.set(false);
      this.error.set('Token de vérification manquant');
      return;
    }

    this.http.post(`${this.apiUrl}/verify-email`, { token }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success) {
          this.success.set(true);
          if (res.token && res.user) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.authService.setAuth(res.token, res.user);
          } else {
            const token = localStorage.getItem('token');
            if (token) {
              this.http.get<{ user: any }>(`${environment.apiUrl}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
              }).subscribe({
                next: (meRes) => {
                  localStorage.setItem('user', JSON.stringify(meRes.user));
                  this.authService.setAuth(token, meRes.user);
                },
                error: () => {}
              });
            }
          }
        } else {
          this.error.set(res.message || 'Erreur de vérification');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Token invalide ou expiré');
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}