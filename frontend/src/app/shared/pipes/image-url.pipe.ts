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
    
    // Fix doubled URLs - find the actual Cloudinary URL after the duplication
    // Pattern: https://res.cloudinary.com/.../image/upload/https://res.cloudinary.com/.../image/upload/v.../xxx.jpg
    if (url.includes('res.cloudinary.com') && url.includes('image/upload/')) {
      const uploads = url.split('/image/upload/');
      if (uploads.length >= 2) {
        // Take the last part after /image/upload/
        const lastPart = '/image/upload/' + uploads[uploads.length - 1];
        url = 'https://res.cloudinary.com' + lastPart;
      }
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