import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { WhatsAppChatComponent } from './shared/components/whatsapp-chat/whatsapp-chat.component';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';
import { QuickViewComponent } from './shared/components/quick-view/quick-view.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { I18nService } from './core/services/i18n.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastComponent, WhatsAppChatComponent, OfflineBannerComponent, QuickViewComponent, BottomNavComponent],
  template: `
    <app-toast />
    <app-navbar *ngIf="!isAdminRoute()"/>
    <main class="min-h-screen pb-20 lg:pb-0" [ngClass]="isAdminRoute() ? 'py-0' : ''">
      <router-outlet/>
    </main>
    <app-footer *ngIf="!isAdminRoute() && !isMobile()"/>
    <app-bottom-nav *ngIf="!isAdminRoute() && isMobile()" />
    <app-whatsapp-chat *ngIf="!isAdminRoute() && !isMobile()" />
    <app-offline-banner />
    <app-quick-view />
  `
})
export class AppComponent {
  private router = inject(Router);
  private i18n = inject(I18nService);
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

  isMobile(): boolean {
    return window.innerWidth < 1024;
  }
}