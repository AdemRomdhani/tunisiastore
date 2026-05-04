import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return 'https://placehold.co/400x400?text=No+Image';
    
    // If it's already a full URL (Cloudinary, external URLs, etc.), return as-is
    if (value.startsWith('http')) return value;
    
    // Handle Cloudinary upload responses
    if (value.startsWith('v') && /^[a-zA-Z0-9]+$/.test(value)) {
      return `https://res.cloudinary.com/${environment.cloudinaryCloudName}/image/upload/${value}`;
    }
    
    // If it's a local upload path, prepend the backend API URL
    if (value.startsWith('/uploads')) {
      return `${environment.apiUrl.replace('/api', '')}${value}`;
    }
    
    return value;
  }
}