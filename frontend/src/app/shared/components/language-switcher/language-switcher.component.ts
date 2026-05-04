import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      (click)="toggleLanguage()"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm font-medium"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
      </svg>
      <span class="uppercase">{{ i18n.getLang() }}</span>
    </button>
  `
})
export class LanguageSwitcherComponent {
  i18n = inject(I18nService);
  languageChange = output<Language>();

  toggleLanguage() {
    this.i18n.toggleLanguage();
    this.languageChange.emit(this.i18n.getLang());
  }
}