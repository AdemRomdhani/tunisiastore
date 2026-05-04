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
    
    // Now return if valid
    if (url.startsWith('https://res.cloudinary.com')) {
      return url;
    }
    
    // Handle plain public_id
    if (url.includes('tunisia-store/') || /^[a-zA-Z0-9_\/-]+$/.test(url)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    }
    
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  }
}