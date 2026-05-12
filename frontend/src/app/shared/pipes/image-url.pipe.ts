import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value || !value.toString().trim()) return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
    
    let url = value.trim();
    const cloudName = 'ddualyszh';
    const baseUrl = environment.apiUrl.replace('/api', '');
    
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
    
    // Handle plain public_id for Cloudinary
    if (url.includes('tunisia-store/') || /^[a-zA-Z0-9_\/-]+$/.test(url)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    }
    
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  }
}