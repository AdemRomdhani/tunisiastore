import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Directive({
  selector: '[appInfiniteScroll]'
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() threshold = '100px';
  @Input() disabled = false;
  @Output() scrolled = new EventEmitter<void>();

  private observer?: IntersectionObserver;
  private subscription?: Subscription;

  constructor(
    private el: ElementRef<Element>,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.disabled) {
          this.scrolled.emit();
        }
      });
    }, { rootMargin: this.threshold });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.subscription?.unsubscribe();
  }
}