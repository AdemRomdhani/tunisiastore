import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value || !value.toString().trim()) return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
    
    const trimmedValue = value.trim();
    
    // If it's already a full URL, return as-is
    if (trimmedValue.startsWith('http')) {
      // Don't show placeholder for valid URLs
      if (trimmedValue.includes('placehold.co')) return trimmedValue;
      return trimmedValue;
    }
    
    // Handle Cloudinary public_id
    const cloudName = environment.cloudinaryCloudName;
    if (cloudName && cloudName !== 'your_cloud_name') {
      // If it looks like a Cloudinary public_id
      if (trimmedValue.includes('tunisia-store/') || /^[a-zA-Z0-9_\/-]+$/.test(trimmedValue)) {
        return `https://res.cloudinary.com/${cloudName}/image/upload/${trimmedValue}`;
      }
    }
    
    // All other cases - show placeholder
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  }
}