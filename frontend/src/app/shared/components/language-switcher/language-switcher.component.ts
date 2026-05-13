import { Component, inject, output, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, Language } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" #dropdownContainer>
      <button 
        (click)="toggleDropdown($event)"
        class="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition text-sm font-medium text-white"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
        </svg>
        <span class="uppercase">{{ currentLang() }}</span>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      @if (isOpen) {
        <div class="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[120px]">
          @for (lang of languages; track lang.code) {
            <button 
              (click)="selectLanguage(lang.code)"
              [class]="currentLang() === lang.code 
                ? 'w-full text-left px-4 py-2 text-sm font-medium bg-gray-100 text-primary-600 hover:bg-gray-200 first:rounded-t-lg last:rounded-b-lg'
                : 'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 first:rounded-t-lg last:rounded-b-lg'"
            >
              {{ lang.name }}
            </button>
          }
        </div>
      }
    </div>
  `
})
export class LanguageSwitcherComponent {
  i18n = inject(I18nService);
  private el = inject(ElementRef);
  languageChange = output<Language>();
  isOpen = false;

  currentLang = computed(() => this.i18n.lang());

  languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'ar' as Language, name: 'العربية' }
  ];

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  selectLanguage(lang: Language) {
    this.i18n.setLanguage(lang);
    this.languageChange.emit(lang);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen && !this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}