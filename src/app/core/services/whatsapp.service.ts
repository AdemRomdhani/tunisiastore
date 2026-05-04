import { Injectable, signal } from '@angular/core';

export interface WhatsAppConfig {
  phoneNumber: string;
  defaultMessage?: string;
  enabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private config = signal<WhatsAppConfig>({
    phoneNumber: '+21655226228',
    defaultMessage: 'Bonjour, j\'ai une question',
    enabled: true
  });

  get configData() {
    return this.config();
  }

  setConfig(config: Partial<WhatsAppConfig>) {
    this.config.update(c => ({ ...c, ...config }));
  }

  isEnabled(): boolean {
    return this.config().enabled !== false;
  }

  getPhoneNumber(): string {
    return this.config().phoneNumber;
  }

  generateMessage(prefilledText?: string): string {
    return prefilledText || this.config().defaultMessage || '';
  }

  generateLink(message?: string): string {
    const phone = this.config().phoneNumber.replace(/\D/g, '');
    const text = encodeURIComponent(message || this.generateMessage());
    return `https://wa.me/${phone}?text=${text}`;
  }
}