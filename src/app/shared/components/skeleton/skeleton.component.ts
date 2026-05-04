import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'product-list') {
      <div class="grid" [class]="gridClass">
        @for (item of itemArray(); track item) {
          <div class="bg-surface-50 rounded-2xl p-4 animate-fade-in">
            <div class="skeleton-shimmer h-48 w-full rounded-xl mb-4"></div>
            <div class="skeleton-shimmer h-4 w-3/4 rounded-lg mb-2"></div>
            <div class="skeleton-shimmer h-3 w-1/2 rounded-lg mb-3"></div>
            <div class="skeleton-shimmer h-6 w-24 rounded-lg"></div>
          </div>
        }
      </div>
    } @else if (type === 'product-detail') {
      <div class="grid lg:grid-cols-2 gap-8 animate-fade-in">
        <div class="space-y-4">
          <div class="skeleton-shimmer h-96 w-full rounded-2xl"></div>
          <div class="flex gap-3">
            @for (img of itemArray(); track img) {
              <div class="skeleton-shimmer h-16 w-16 rounded-xl"></div>
            }
          </div>
        </div>
        <div class="space-y-4">
          <div class="skeleton-shimmer h-8 w-3/4 rounded-lg"></div>
          <div class="skeleton-shimmer h-4 w-1/4 rounded-lg"></div>
          <div class="skeleton-shimmer h-12 w-1/3 rounded-xl"></div>
          <div class="skeleton-shimmer h-24 w-full rounded-xl"></div>
          <div class="flex gap-3">
            <div class="skeleton-shimmer h-14 w-32 rounded-xl"></div>
            <div class="skeleton-shimmer h-14 flex-1 rounded-xl"></div>
          </div>
        </div>
      </div>
    } @else if (type === 'table') {
      <div class="bg-surface-50 rounded-2xl shadow-card overflow-hidden animate-fade-in">
        <div class="px-6 py-5 border-b border-surface-200">
          <div class="skeleton-shimmer h-6 w-40 rounded-lg"></div>
        </div>
        <div class="divide-y divide-surface-100">
          @for (row of rowArray(); track row) {
            <div class="flex items-center gap-4 px-6 py-4">
              <div class="skeleton-shimmer h-12 w-12 rounded-xl"></div>
              <div class="flex-1 space-y-2">
                <div class="skeleton-shimmer h-4 w-3/4 rounded-lg"></div>
                <div class="skeleton-shimmer h-3 w-1/3 rounded-lg"></div>
              </div>
              <div class="skeleton-shimmer h-6 w-20 rounded-lg"></div>
              <div class="skeleton-shimmer h-6 w-24 rounded-lg"></div>
            </div>
          }
        </div>
      </div>
    } @else if (type === 'card') {
      <div class="grid" [class]="gridClass">
        @for (card of rowArray(); track card) {
          <div class="bg-surface-50 rounded-2xl p-6 shadow-card animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <div class="skeleton-shimmer h-4 w-20 rounded-lg"></div>
              <div class="skeleton-shimmer h-10 w-10 rounded-full"></div>
            </div>
            <div class="skeleton-shimmer h-8 w-28 rounded-lg mb-2"></div>
            <div class="skeleton-shimmer h-4 w-32 rounded-lg"></div>
          </div>
        }
      </div>
    } @else if (type === 'stats') {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of statRows; track stat) {
          <div class="bg-surface-50 rounded-2xl p-6 shadow-card border-l-4 animate-slide-up" [style.borderColor]="stat.color">
            <div class="skeleton-shimmer h-4 w-24 rounded-lg mb-3"></div>
            <div class="skeleton-shimmer h-10 w-20 rounded-lg mb-2"></div>
            <div class="skeleton-shimmer h-3 w-28 rounded-lg"></div>
          </div>
        }
      </div>
    } @else if (type === 'hero') {
      <div class="space-y-6 animate-fade-in">
        <div class="skeleton-shimmer h-12 w-2/3 rounded-xl"></div>
        <div class="skeleton-shimmer h-6 w-full rounded-lg"></div>
        <div class="skeleton-shimmer h-6 w-4/5 rounded-lg"></div>
        <div class="flex gap-4">
          <div class="skeleton-shimmer h-14 w-32 rounded-xl"></div>
          <div class="skeleton-shimmer h-14 w-32 rounded-xl"></div>
        </div>
      </div>
    } @else if (type === 'category-grid') {
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        @for (cat of rowArray(); track cat) {
          <div class=" bg-surface-50 rounded-2xl p-6 text-center animate-scale-in">
            <div class="skeleton-shimmer h-12 w-12 rounded-full mx-auto mb-3"></div>
            <div class="skeleton-shimmer h-4 w-16 mx-auto rounded-lg"></div>
          </div>
        }
      </div>
    } @else {
      <div class="skeleton-shimmer h-32 w-full rounded-xl animate-fade-in"></div>
    }
  `,
  styles: [`
    :host { display: block; }
    .skeleton-shimmer {
      background: linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite linear;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'product-list' | 'product-detail' | 'table' | 'card' | 'stats' | 'hero' | 'category-grid' | 'default' = 'default';
  @Input() count = 5;
  @Input() gridClass = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

  rowArray = computed(() => Array(this.count));
  itemArray = computed(() => {
    const items = [];
    for (let i = 0; i < this.count; i++) items.push(i);
    return items;
  });
  
  statRows = [
    { color: '#3b82f6' },
    { color: '#22c55e' },
    { color: '#8b5cf6' },
    { color: '#f59e0b' }
  ];
}