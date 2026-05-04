import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { ToastService } from '../../core/services/toast.service';
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-center mb-2">Contactez-nous</h1>
      <p class="text-gray-600 text-center mb-8">Nous sommes disponibles pour répondre à vos questions</p>

      @if (success()) {
        <div class="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6">
          <p class="font-medium">Message envoyé avec succès!</p>
          <p class="text-sm">Nous vous répondrons dans les plus brefs délais.</p>
        </div>
      }

      <form (ngSubmit)="sendMessage()" class="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
            <input type="text" [(ngModel)]="form.name" name="name" required
                   class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                   placeholder="Votre nom">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" [(ngModel)]="form.email" name="email" required
                   class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                   placeholder="votre@email.com">
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input type="tel" [(ngModel)]="form.phone" name="phone"
                 class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                 placeholder="+216 XX XXX XXX">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sujet *</label>
          <select [(ngModel)]="form.subject" name="subject" required
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
            <option value="">Choisir un sujet</option>
            <option value="order">Question sur une commande</option>
            <option value="product">Question sur un produit</option>
            <option value="return">Retour &amp; Remboursement</option>
            <option value="partnership">Partenariat</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Message *</label>
          <textarea [(ngModel)]="form.message" name="message" rows="5" required
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    placeholder="Décrivez votre demande..."></textarea>
        </div>

        <button type="submit" [disabled]="sending()" 
                class="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50">
          {{ sending() ? 'Envoi en cours...' : 'Envoyer le message' }}
        </button>
      </form>

      <!-- Contact Info -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </div>
          <p class="font-medium">+21655226228</p>
          <p class="text-sm text-gray-500">Téléphone</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <p class="font-medium">adem.micro13&#64;gmail.com</p>
          <p class="text-sm text-gray-500">Email</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p class="font-medium">Rue hammamet douar hicher Manouba 2086</p>
          <p class="text-sm text-gray-500">Adresse</p>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {
  private http = inject(HttpClient);
  private toast: ToastService = inject(ToastService);

  form = { name: '', email: '', phone: '', subject: '', message: '' };
  sending = signal(false);
  success = signal(false);

  contact = environment.contact;

  sendMessage() {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) {
      this.toast.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.sending.set(true);
    this.http.post(`${environment.apiUrl}/contact`, this.form).subscribe({
      next: () => {
        this.success.set(true);
        this.form = { name: '', email: '', phone: '', subject: '', message: '' };
        this.sending.set(false);
        this.toast.success('Succès', 'Message envoyé');
      },
      error: () => {
        this.sending.set(false);
        this.toast.error('Erreur', 'Impossible d\'envoyer le message');
      }
    });
  }
}