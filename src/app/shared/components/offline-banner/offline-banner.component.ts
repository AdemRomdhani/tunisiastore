import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '../../../core/services/network.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (networkService.wasOffline()) {
      <div class="fixed bottom-0 left-0 right-0 bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 z-50">
        <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
        </svg>
        <span class="text-sm font-medium">Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.</span>
        @if (showRetry) {
          <button (click)="retry.emit()" class="bg-white text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">
            Réessayer
          </button>
        }
      </div>
    }
  `
})
export class OfflineBannerComponent {
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
  
  networkService = inject(NetworkService);
}