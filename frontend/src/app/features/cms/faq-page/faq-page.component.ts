import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">Foire Aux Questions</h1>
      
      @if (loading()) {
        <div class="text-center py-12">
          <p class="text-gray-500">Chargement...</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (faq of faqs(); track faq._id) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                (click)="toggle(faq._id)"
                class="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span class="font-semibold text-gray-900">{{ faq.title }}</span>
                <svg [class.rotate-180]="expandedId() === faq._id" 
                     class="w-5 h-5 text-gray-500 transform transition-transform" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              @if (expandedId() === faq._id) {
                <div class="px-6 pb-4 text-gray-600">
                  {{ faq.content }}
                </div>
              }
            </div>
          }
        </div>
      }
      
      @if (faqs().length === 0 && !loading()) {
        <div class="text-center py-12">
          <p class="text-gray-500">Aucune question pour le moment.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .rotate-180 {
      transform: rotate(180deg);
    }
  `]
})
export class FaqPageComponent implements OnInit {
  private http = inject(HttpClient);
  
  faqs = signal<any[]>([]);
  loading = signal(true);
  expandedId = signal<string | null>(null);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/cms/faqs`).subscribe({
      next: (res) => {
        if (res.success) {
          this.faqs.set(res.faqs);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggle(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }
}