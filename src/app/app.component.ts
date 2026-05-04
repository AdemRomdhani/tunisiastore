import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { WhatsAppChatComponent } from './shared/components/whatsapp-chat/whatsapp-chat.component';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastComponent, WhatsAppChatComponent, OfflineBannerComponent],
  template: `
    <app-toast />
    <app-navbar *ngIf="!isAdminRoute()"/>
    <main class="min-h-screen" [ngClass]="isAdminRoute() ? 'py-0' : ''">
      <router-outlet/>
    </main>
    <app-footer *ngIf="!isAdminRoute()"/>
    <app-whatsapp-chat *ngIf="!isAdminRoute()" />
    <app-offline-banner />
  `
})
export class AppComponent {
  private router = inject(Router);
  private currentUrl = '/';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.urlAfterRedirects;
    });
  }

  isAdminRoute(): boolean {
    return this.currentUrl.startsWith('/admin');
  }
}