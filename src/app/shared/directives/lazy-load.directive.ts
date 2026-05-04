import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input('appLazyLoad') imageSrc!: string;
  @Input() placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle"%3ELoading...%3C/text%3E%3C/svg%3E';

  private observer?: IntersectionObserver;
  private loaded = false;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
    this.renderer.setAttribute(this.el.nativeElement, 'loading', 'lazy');

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loaded) {
          this.loadImage();
        }
      });
    }, { rootMargin: '50px' });

    this.observer.observe(this.el.nativeElement);
  }

  private loadImage() {
    if (this.loaded) return;
    this.loaded = true;

    const img = new Image();
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.imageSrc);
      this.renderer.removeAttribute(this.el.nativeElement, 'alt');
    };
    img.onerror = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
    };
    img.src = this.imageSrc;

    if (this.observer) {
      this.observer.disconnect();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}