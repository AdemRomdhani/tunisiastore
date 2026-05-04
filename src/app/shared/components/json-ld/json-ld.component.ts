// json-ld.component.ts
import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-json-ld',
  standalone: true,
  template: '', // Empty template, we'll inject via Renderer2 or ngOnInit
})
export class JsonLdComponent implements OnChanges {
  @Input() data: any;
  private sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    this.addJsonLd();
  }

  private addJsonLd() {
    // Remove existing script tag if any
    const existingScript = document.getElementById('json-ld-script');
    if (existingScript) {
      existingScript.remove();
    }

    if (!this.data || Object.keys(this.data).length === 0) return;

    // Create script element properly (bypasses Angular sanitization)
    const script = document.createElement('script');
    script.id = 'json-ld-script';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(this.data);
    document.head.appendChild(script);
  }
}