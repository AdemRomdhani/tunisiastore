import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = computed(() => this._toasts());

  show(type: Toast['type'], title: string, message?: string, duration = 4000) {
    // Vérifier si une notification identique existe déjà
    const existingToast = this._toasts().find(
      t => t.type === type && t.title === title && t.message === message
    );

    if (existingToast) {
      // Supprimer l'ancienne notification identique pour éviter les doublons
      this.dismiss(existingToast.id);
    }

    const id = crypto.randomUUID();
    const toast: Toast = { id, type, title, message, duration };
    this._toasts.update(t => [...t, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(title: string, message?: string) { this.show('success', title, message); }
  error(title: string, message?: string) { this.show('error', title, message, 6000); }
  warning(title: string, message?: string) { this.show('warning', title, message); }
  info(title: string, message?: string) { this.show('info', title, message); }

  dismiss(id: string) {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}