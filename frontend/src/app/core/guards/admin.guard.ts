import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user data is already loaded
  if (authService.currentUser()) {
    if (authService.isAdmin() || authService.isSupervisor()) {
      return true;
    }
    router.navigate(['/']);
    return false;
  }

  // Wait for auth check to complete
  // We poll until the user is loaded or we determine there's no user
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const user = authService.currentUser();
      
      if (user) {
        clearInterval(checkInterval);
        if (user.role === 'admin' || user.role === 'supervisor') {
          resolve(true);
        } else {
          router.navigate(['/']);
          resolve(false);
        }
      }
    }, 100);

    // Timeout after 2 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      resolve(false);
    }, 2000);
  });
};