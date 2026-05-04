import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p class="text-gray-500 mt-2">Rejoignez Tunisia Store</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-8">
          <form (ngSubmit)="register()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" [(ngModel)]="user.firstName" name="firstName" required class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" [(ngModel)]="user.lastName" name="lastName" required class="input-field">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" [(ngModel)]="user.email" name="email" required class="input-field" placeholder="votre@email.com">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" [(ngModel)]="user.phone" name="phone" required class="input-field" placeholder="XX XXX XXX">
              <p class="text-xs text-gray-500 mt-1">Format: 8 chiffres (ex: 20123456)</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" [(ngModel)]="user.password" name="password" required minlength="6" class="input-field">
            </div>

            @if (error()) {
              <div class="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {{ error() }}
              </div>
            }

            <button 
              type="submit"
              [disabled]="loading()"
              class="w-full btn-primary py-3"
            >
              @if (loading()) {
                Inscription en cours...
              } @else {
                S'inscrire
              }
            </button>
          </form>

          <div class="mt-6 text-center text-sm">
            <span class="text-gray-500">Déjà un compte ?</span>
            <a routerLink="/login" class="text-primary-600 font-medium hover:underline ml-1">Se connecter</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  };

  loading = signal(false);
  error = signal('');

  register() {
    this.loading.set(true);
    this.error.set('');

    this.authService.register(this.user).subscribe({
      next: (res) => {
        this.authService.setAuth(res.token, res.user);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erreur lors de l\'inscription');
      }
    });
  }
}