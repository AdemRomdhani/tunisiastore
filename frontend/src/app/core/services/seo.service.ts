import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private defaultImage = 'https://tunisiastore.tn/assets/og-image.jpg';

  updateMeta(meta: Partial<PageMeta>) {
    const pageTitle = meta.title ? `${meta.title} | Tunisia Store` : 'Tunisia Store - Vente en ligne en Tunisie';
    const pageDesc = meta.description || 'Achetez smartphones, ordinateurs et électronique en Tunisie. Livraison rapide et prix compétitifs.';
    
    this.title.setTitle(pageTitle);
    
    this.meta.updateTag({ name: 'description', content: pageDesc });
    this.meta.updateTag({ name: 'keywords', content: meta.keywords || 'tunisie, smartphone, pc, electronique, prix tunisie' });
    
    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDesc });
    this.meta.updateTag({ property: 'og:image', content: meta.image || this.defaultImage });
    this.meta.updateTag({ property: 'og:url', content: meta.url || 'https://tunisiastore.tn' });
    this.meta.updateTag({ property: 'og:type', content: meta.type || 'website' });
    
    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDesc });
    this.meta.updateTag({ name: 'twitter:image', content: meta.image || this.defaultImage });
  }
}