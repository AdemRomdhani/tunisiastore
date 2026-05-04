import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return 'https://placehold.co/400x400?text=No+Image';
    
    // If it's already a full URL (Cloudinary, etc.), return as-is
    if (value.startsWith('http')) return value;
    
    // If it's a local upload path, prepend the backend API URL
    if (value.startsWith('/uploads')) {
      return `${environment.apiUrl.replace('/api', '')}${value}`;
    }
    
    return value;
  }
}