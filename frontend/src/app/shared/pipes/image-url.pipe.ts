import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value || value.length < 5) return 'https://placehold.co/400x400/e2e8f0/1e293b?text=Image';
    
    // If it's already a full URL (Cloudinary, external URLs, etc.), return as-is
    if (value.startsWith('http')) return value;
    
    // Handle Cloudinary upload responses (just the public_id)
    if (value.startsWith('tunisia-store/')) {
      return `https://res.cloudinary.com/${environment.cloudinaryCloudName}/image/upload/${value}`;
    }
    
    // Handle Cloudinary public_id patterns (alphanumeric with underscores/dashes)
    const cloudName = environment.cloudinaryCloudName;
    if (cloudName && cloudName !== 'your_cloud_name' && /^[a-zA-Z0-9_-]+$/.test(value)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/tunisia-store/${value}`;
    }
    
    // Local uploads - old format that won't work on Render (no persistent storage)
    // Return placeholder for these
    if (value.includes('uploads') || value.startsWith('products/') || value.startsWith('images-')) {
      return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
    }
    
    // Fallback to placeholder
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=Image';
  }
}