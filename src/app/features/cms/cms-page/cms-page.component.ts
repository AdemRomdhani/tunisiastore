import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cms-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cms-page" *ngIf="page(); else loading">
      <div class="container mx-auto px-4 py-12 max-w-4xl">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">{{ page().title }}</h1>
        <div class="prose prose-lg max-w-none" [innerHTML]="page().content"></div>
      </div>
    </div>
    
    <ng-template #loading>
      <div class="container mx-auto px-4 py-12 text-center">
        <p class="text-gray-500">Chargement...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .prose {
      color: #333;
      line-height: 1.8;
    }
    .prose h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    .prose h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .prose p {
      margin-bottom: 1rem;
    }
    .prose ul, .prose ol {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    .prose li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class CmsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  page = signal<any>(null);
  
  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.http.get<any>(`${environment.apiUrl}/cms/page/${slug}`).subscribe({
        next: (res) => {
          if (res.success) {
            this.page.set(res.page);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: () => this.router.navigate(['/'])
      });
    }
  }
}