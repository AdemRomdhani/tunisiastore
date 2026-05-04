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
    
    // Fix doubled URLs - remove the first part if it's duplicated
    const doubledPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/https:\/\/res\.cloudinary\.com\//;
    if (doubledPattern.test(url)) {
      url = url.replace(/^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\//, '');
    }
    
    // If it's already a full URL, return as-is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Handle Cloudinary public_id
    const cloudName = environment.cloudinaryCloudName;
    if (cloudName && cloudName !== 'your_cloud_name') {
      if (url.includes('tunisia-store/') || /^[a-zA-Z0-9_\/-]+$/.test(url)) {
        return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
      }
    }
    
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  }
}