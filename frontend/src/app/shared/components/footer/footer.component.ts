import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../../core/services/newsletter.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <footer class="bg-surface-900 text-surface-300 mt-16">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <!-- About + Newsletter -->
          <div class="lg:col-span-1">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-xl">TS</span>
              </div>
              <span class="text-white text-xl font-bold">Tunisia Store</span>
            </div>
            <p class="text-sm leading-relaxed mb-6 text-surface-400">
              {{ 'footer.aboutDesc' | t }}
            </p>
            <div class="flex gap-3">
              <a href="https://facebook.com" target="_blank" class="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all duration-200">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" class="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all duration-200">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.819 4.817.058 2.213.075 3.295.075 4.819 0 3.204-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.819 4.819-1.266.058-2.594.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.819-4.83-.062-2.217-.075-3.297-.075-4.819.012-3.204.012-3.583.07-4.849.149-3.227 1.658-4.771 4.819-4.771 1.266-.058 2.594-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.947.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.947-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.2-4.354-2.617-6.78-6.979-6.979-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.441-1.441-1.441z"/>
                </svg>
              </a>
              <a href="https://wa.me/21655226228" target="_blank" class="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center hover:bg-primary-600 transition-all duration-200">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 4.318c-.835.37-1.84.637-2.854.678 1.018-.61 1.798-1.56 2.167-2.702-.95.558-2.01.963-3.127 1.184-.896-.948-2.171-1.543-3.594-1.543-2.722 0-4.923 2.201-4.923 4.893 0 .385.045.762.127 1.124-4.044-.201-7.635-2.14-10.029 5.1-.838.51-1.777.814-2.722.978-1.786-.553-3.369-1.641-4.363-3.548-.248-.486-.385-1.01-.385-1.595v-.034c.415-.266.818-.544 1.113-1.008-.965.285-2.043.493-3.137.583-.304-.476-.738-1.058-1.067-1.845-.216-.51-.245-1.045-.168-1.587 2.013-.08 3.905-1.39 5.357-2.477.966.29 1.982.458 3.046.482 1.058-.007 2.08-.14 3.024-.482-1.338-1.016-2.306-2.679-1.991-4.192.188-.776.487-1.484.88-2.132 1.176 1.417 2.768 2.23 4.582 2.488-1.125.762-2.534 1.17-3.89 1.17-2.13 0-4.016-.772-5.487-2.083 1.326.05 2.593.22 3.752.666zm5.318-2.318C19.102 2.163 12 .163 12 .163S4.898 2.163 2.79 2.163 0 8.836 0 12s7.102 9.836 9.79 9.836 9.836-7.102 9.836-9.836-1.296-9.836-3.836-9.836zm-1.5 10.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5z"/>
                </svg>
              </a>
            </div>
            <div class="mt-6">
              <h4 class="text-white font-semibold mb-3 text-sm">{{ 'footer.newsletter' | t }}</h4>
              <p class="text-xs text-surface-500 mb-3">{{ 'footer.subscribeText' | t }}</p>
              <form (ngSubmit)="subscribeNewsletter()" class="flex gap-2">
                <input type="email" [(ngModel)]="email" name="email" [placeholder]="i18n.t('common.email')" 
                       class="flex-1 px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors">
                <button type="submit" [disabled]="subscribing()" 
                        class="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 text-sm disabled:opacity-50">
                  {{ subscribing() ? '...' : 'OK' }}
                </button>
              </form>
              @if (subscribed()) {
                <p class="text-emerald-400 text-xs mt-2">Merci pour votre inscription!</p>
              }
              @if (errorMessage()) {
                <p class="text-red-400 text-xs mt-2">{{ errorMessage() }}</p>
              }
            </div>
          </div>

          <!-- Links -->
          <div>
            <h4 class="text-white font-semibold mb-5">Liens rapides</h4>
            <ul class="space-y-3 text-sm">
              <li><a routerLink="/products" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                Nos produits
              </a></li>
              <li><a routerLink="/bundles" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                Packs & Bundles
              </a></li>
              <li><a routerLink="/recently-viewed" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Vus récemment
              </a></li>
              <li><a routerLink="/compare" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                Comparer
              </a></li>
            </ul>
          </div>

          <!-- Service -->
          <div>
            <h4 class="text-white font-semibold mb-5">Service client</h4>
            <ul class="space-y-3 text-sm">
              <li><a routerLink="/contact" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Contactez-nous
              </a></li>
              <li><a routerLink="/page/a-propos" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                À propos
              </a></li>
              <li><a routerLink="/faq" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 14.523c1.06-.427 1.824-.835 2.57-1.225.924-.485 1.4-.98 1.4-1.705 0-.95-.736-1.542-1.378-1.542-.653 0-1.295.378-1.645.82-.363.46-.643 1.016-1.04 1.04l-1.207-1zM12 2.25C6.477 2.25 2.25 6.477 2.25 12S6.477 21.75 12 21.75 21.75 17.523 21.75 12 17.523 2.25 12 2.25z"/></svg>
                FAQ
              </a></li>
              <li><a routerLink="/order/track" class="hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Suivre commande
              </a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="text-white font-semibold mb-5">Contact</h4>
            <ul class="space-y-3 text-sm">
              <li class="flex items-center gap-3 text-surface-400">
                <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Ariana, Tunis
              </li>
              <li class="flex items-center gap-3 text-surface-400">
                <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                +216 55226228
              </li>
              <li class="flex items-center gap-3 text-surface-400">
                <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                contact&#64;tunisia-store.tn
              </li>
              <li class="flex items-center gap-3 text-surface-400">
                <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Lun-Sam: 8h30 - 18h00
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-surface-800 mt-12 pt-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-surface-500">
            <p>© 2026 Tunisia Store. Tous droits réservés.</p>
            <div class="flex items-center gap-6">
              <a routerLink="/page/conditions-generales" class="hover:text-white transition-colors">Conditions générales</a>
              <a routerLink="/page/politique-confidentialite" class="hover:text-white transition-colors">Confidentialité</a>
              <a routerLink="/page/politique-remboursement" class="hover:text-white transition-colors">Remboursement</a>
            </div>
            <p class="text-xs">MF: 1915020L/A/M/000</p>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  private newsletterService = inject(NewsletterService);
  i18n = inject(I18nService);
  
  email = '';
  subscribing = signal(false);
  subscribed = signal(false);
  errorMessage = signal<string | null>(null);

  subscribeNewsletter() {
    if (!this.email) return;
    
    this.subscribing.set(true);
    this.errorMessage.set(null);
    this.subscribed.set(false);
    
    this.newsletterService.subscribe(this.email).subscribe({
      next: () => {
        this.subscribed.set(true);
        this.email = '';
        this.subscribing.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Une erreur est survenue');
        this.subscribing.set(false);
      }
    });
  }
}