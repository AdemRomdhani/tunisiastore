import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div class="text-sm text-gray-500">
          Affichage {{ startIndex() }}-{{ endIndex() }} sur {{ totalItems() }}
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="goToPage(page() - 1)"
            [disabled]="page() === 1"
            class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          @for (p of visiblePages(); track p) {
            @if (p === -1) {
              <span class="px-2 text-gray-400">...</span>
            } @else {
              <button
                (click)="goToPage(p)"
                class="w-9 h-9 rounded-lg text-sm font-medium transition"
                [class]="page() === p
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'"
              >
                {{ p }}
              </button>
            }
          }

          <button
            (click)="goToPage(page() + 1)"
            [disabled]="page() === totalPages()"
            class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    }
  `
})
export class PaginationComponent {
  @Input() set total(val: number) { this.totalVal.set(val); }
  @Input() set pageSize(val: number) { this.pageSizeVal.set(val); }
  @Input() set currentPage(val: number) { this.currentPageVal.set(val); }
  @Output() pageChange = new EventEmitter<number>();

  private totalVal = signal(0);
  private pageSizeVal = signal(20);
  private currentPageVal = signal(1);
  readonly page = computed(() => this.currentPageVal());
  readonly totalPages = computed(() => Math.ceil(this.totalVal() / this.pageSizeVal()));
  readonly totalItems = computed(() => this.totalVal());
  readonly startIndex = computed(() => Math.min((this.currentPageVal() - 1) * this.pageSizeVal() + 1, this.totalVal()));
  readonly endIndex = computed(() => Math.min(this.currentPageVal() * this.pageSizeVal(), this.totalVal()));

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPageVal();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPageVal.set(page);
      this.pageChange.emit(page);
    }
  }

  reset() {
    this.currentPageVal.set(1);
  }
}