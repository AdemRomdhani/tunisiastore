import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined | null, size?: 'thumb' | 'card' | 'detail' | 'full'): string {
    if (!value || !value.toString().trim()) return this.getPlaceholder();
    
    let url = value.trim();
    const cloudName = 'ddualyszh';
    const baseUrl = environment.apiUrl.replace('/api', '');
    
    // Cloudinary transformation params per size
    const transforms: Record<string, string> = {
      thumb: 'w_200,h_200,c_fit,q_auto,f_auto',
      card: 'w_400,h_400,c_fit,q_auto,f_auto',
      detail: 'w_800,h_800,c_fit,q_auto,f_auto',
      full: 'q_auto,f_auto'
    };
    const transform = transforms[size || 'card'] || transforms['card'];

    // Already a full URL - return as is
    if (url.startsWith('http')) {
      // Fix URLs missing cloud name: res.cloudinary.com/image/upload/ -> res.cloudinary.com/ddualyszh/image/upload/
      if (url.match(/^https:\/\/res\.cloudinary\.com\/image\/upload\//)) {
        url = url.replace('res.cloudinary.com/image/upload/', `res.cloudinary.com/${cloudName}/image/upload/`);
      }
      
      // Fix doubled URLs (contains the URL twice)
      if (url.match(/res\.cloudinary\.com\/image\/upload\/https:\/\/res\.cloudinary\.com\/image\/upload\//)) {
        const idx = url.lastIndexOf('/image/upload/');
        if (idx > 0) {
          url = 'https://res.cloudinary.com' + url.substring(idx);
        }
      }

      // Inject Cloudinary transforms into existing Cloudinary URLs
      if (url.includes('res.cloudinary.com/') && url.includes('/image/upload/')) {
        // Don't double-add transforms
        if (!url.includes('/image/upload/w_') && !url.includes('/image/upload/q_')) {
          url = url.replace('/image/upload/', `/image/upload/${transform}/`);
        }
        return url;
      }
      
      return url;
    }
    
    // Handle local upload paths - use the API base URL from environment
    if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
      const uploadBase = environment.production 
        ? `https://tunisiastore.onrender.com`
        : baseUrl;
      // Remove leading slash if present to avoid double slash
      const cleanPath = url.startsWith('/') ? url.substring(1) : url;
      return `${uploadBase}/${cleanPath}`;
    }
    
    // Handle plain public_id for Cloudinary (e.g. "tunisia-store/image/upload/v123/file.jpg" or "tunisia-store/xxx")
    if (url.includes('tunisia-store/') || /^[a-zA-Z0-9_\/-]+$/.test(url)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${url}`;
    }
    
    return this.getPlaceholder();
  }

  private getPlaceholder(): string {
    return 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f1f5f9" width="400" height="400"/><g transform="translate(160,140)" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="10" y="20" width="60" height="50" rx="4"/><circle cx="30" cy="38" r="6"/><path d="M15 60 L30 48 L45 55 L60 40 L70 55 L70 70 L10 70Z"/></g><text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#94a3b8">Pas d'image</text></svg>`
    );
  }
}
