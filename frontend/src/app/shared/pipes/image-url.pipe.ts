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
    const cloudName = environment.cloudinaryCloudName;
    
    // Fix URLs missing cloud name: res.cloudinary.com/image/upload/xxx -> res.cloudinary.com/ddualyszh/image/upload/xxx
    if (url.includes('res.cloudinary.com') && !url.includes(`res.cloudinary.com/${cloudName}/image/upload`)) {
      url = url.replace(
        /res\.cloudinary\.com\/image\/upload\//,
        `res.cloudinary.com/${cloudName}/image/upload/`
      );
    }
    
    // Fix doubled URLs
    if (url.includes('res.cloudinary.com') && url.includes('image/upload/')) {
      const uploads = url.split('/image/upload/');
      if (uploads.length >= 2) {
        const lastPart = '/image/upload/' + uploads[uploads.length - 1];
        url = `https://res.cloudinary.com/${cloudName}` + lastPart;
      }
    }
    
    // If it's a full URL with cloud name, return it
    if (url.startsWith('http') && url.includes(`res.cloudinary.com/${cloudName}/image/upload`)) {
      return url;
    }
    
    // Handle plain public_id
    if (cloudName && cloudName !== 'your_cloud_name') {
      if (url.includes('tunisia-store/') || /^[a-zA-Z0-9_\/-]+$/.test(url)) {
        return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
      }
    }
    
    return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  }
}