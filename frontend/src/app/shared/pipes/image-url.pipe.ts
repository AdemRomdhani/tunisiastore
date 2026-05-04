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
    
    // If it's already a full URL (Cloudinary, external URLs, etc.), return as-is
    if (trimmedValue.startsWith('http')) return trimmedValue;
    
    // Handle Cloudinary upload responses (just the public_id)
    if (trimmedValue.startsWith('tunisia-store/')) {
      return `https://res.cloudinary.com/${environment.cloudinaryCloudName}/image/upload/${trimmedValue}`;
    }
    
    // Handle Cloudinary public_id patterns (alphanumeric with underscores/dashes)
    const cloudName = environment.cloudinaryCloudName;
    if (cloudName && cloudName !== 'your_cloud_name' && /^[a-zA-Z0-9_-]+$/.test(trimmedValue)) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/tunisia-store/${trimmedValue}`;
    }
    
    // Check if it's any kind of relative path or local image file that won't resolve
    // This includes: /uploads/*, uploads/*, products/*, images-*.jpg, *.jpg, *.png, *.webp
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedValue);
    const isLocalPath = trimmedValue.includes('uploads') || 
                        trimmedValue.includes('products') || 
                        trimmedValue.startsWith('images-') ||
                        trimmedValue.startsWith('/images');
    
    if (isLocalPath || hasImageExtension) {
      return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
    }
    
    // Fallback to placeholder
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  }
}