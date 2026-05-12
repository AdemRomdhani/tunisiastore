import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface-50 py-8 sm:py-12 px-3 sm:px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-6 sm:mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-surface-900">Connexion</h1>
          <p class="text-surface-500 mt-2">Accédez à votre compte</p>
        </div>

        <div class="bg-surface-50 rounded-2xl shadow-card p-5 sm:p-8">
          <form (ngSubmit)="login()" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-2">Email</label>
              <input 
                type="email" 
                [(ngModel)]="credentials.email"
                name="email"
                required
                class="input-field"
                placeholder="votre@email.com"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-surface-700 mb-2">Mot de passe</label>
              <input 
                type="password" 
                [(ngModel)]="credentials.password"
                name="password"
                required
                class="input-field"
                placeholder="••••••••"
              >
            </div>

            @if (error()) {
              <div class="bg-red-50 text-red-600 text-sm p-4 rounded-xl">
                {{ error() }}
              </div>
            }

            @if (warning()) {
              <div class="bg-yellow-50 text-yellow-700 text-sm p-4 rounded-xl">
                {{ warning() }}
              </div>
            }

            <button 
              type="submit"
              [disabled]="loading()"
              class="w-full btn-primary py-3.5 text-base"
            >
              @if (loading()) {
                <svg class="w-5 h-5 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </form>

          <div class="mt-6 text-center text-sm">
            <span class="text-surface-500">Pas encore de compte ?</span>
            <a routerLink="/register" class="text-primary-600 font-medium hover:text-primary-700 transition-colors ml-1">S'inscrire</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  credentials = { email: '', password: '' };
  loading = signal(false);
  error = signal('');
  warning = signal('');

  login() {
    this.loading.set(true);
    this.error.set('');
    this.warning.set('');

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.authService.setAuth(res.token, res.user);
        // Always redirect to home page after login
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Email ou mot de passe incorrect');
      }
    });
  }
}