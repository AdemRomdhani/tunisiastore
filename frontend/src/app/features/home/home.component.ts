import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService, Product } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SeoService } from '../../core/services/seo.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ProductCardComponent, FormsModule],
  template: `
    <div class="min-h-screen">
      <!-- Hero Section - Enhanced -->
      <section class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <!-- Animated Background -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] bg-primary-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
        </div>
        
        <div class="container mx-auto px-3 sm:px-4 py-12 sm:py-16 lg:py-32 relative">
          <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div class="max-w-2xl">
              <span class="inline-flex items-center gap-2 bg-white/10 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6">
                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Nouvelle collection 2026
              </span>
              <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                La technologie<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-200">à votre portée</span>
              </h1>
              <p class="text-sm sm:text-base lg:text-lg text-primary-100 mb-6 sm:mb-8 leading-relaxed">
               Découvrez notre sélection exclusive de smartphones, ordinateurs et accessoires aux meilleurs prix en Tunisie. Livraison rapide et garantie authentique.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <a routerLink="/products" class="group bg-white text-primary-600 px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg hover:shadow-xl text-center text-sm sm:text-base">
                  Découvrir
                  <svg class="inline-block ml-2 w-4 h-4 sm:w-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </a>
                <a routerLink="/products" [queryParams]="{onSale: true}" class="flex items-center justify-center gap-2 border-2 border-white/30 text-white px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-xl font-semibold hover:bg-white/10 transition text-center text-sm sm:text-base">
                  <svg class="w-4 h-4 sm:w-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Promotions
                </a>
              </div>
            </div>
            
            <div class="hidden lg:block relative">
              <div class="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
                <div class="grid grid-cols-2 gap-6">
                  <div class="text-center">
                    <div class="text-4xl font-bold">10K+</div>
                    <div class="text-primary-200 text-sm">Clients satisfaits</div>
                  </div>
                  <div class="text-center">
                    <div class="text-4xl font-bold">500+</div>
                    <div class="text-primary-200 text-sm">Produits</div>
                  </div>
                  <div class="text-center">
                    <div class="text-4xl font-bold">24h</div>
                    <div class="text-primary-200 text-sm">Livraison</div>
                  </div>
                  <div class="text-center">
                    <div class="text-4xl font-bold">4.9</div>
                    <div class="text-primary-200 text-sm">Note moyenne</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features - Enhanced -->
      <section class="py-10 sm:py-16 bg-white border-b">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            @for (feature of features; track feature.title) {
              <div class="group flex items-center sm:block gap-2 sm:gap-4 p-3 sm:p-6 rounded-xl sm:rounded-2xl hover:bg-primary-50 transition-all duration-300">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-primary-100 rounded-lg sm:rounded-xl flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform flex-shrink-0">
                  <span class="text-lg sm:text-2xl">{{ feature.icon }}</span>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-gray-900 text-xs sm:text-base truncate sm:truncate-none">{{ feature.title }}</h3>
                  <p class="text-xs text-gray-500 hidden sm:block">{{ feature.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Categories Quick Access -->
      <section class="py-10 sm:py-16 bg-gray-50">
        <div class="container mx-auto px-3 sm:px-4">
          <h2 class="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-8">Catégories</h2>
          <div class="flex sm:grid overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 gap-2 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            @for (cat of categories; track cat.name) {
              <a [routerLink]="['/products']" [queryParams]="{category: cat.slug}" 
                 class="group bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center hover:shadow-lg transition border border-gray-100 flex-shrink-0 w-24 sm:w-auto">
                <div class="text-3xl sm:text-4xl mb-1 sm:mb-3 group-hover:scale-125 transition">{{ cat.icon }}</div>
                <div class="font-medium text-gray-900 group-hover:text-primary-600 transition text-xs sm:text-sm">{{ cat.name }}</div>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="py-10 sm:py-16">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900">Produits en vedette</h2>
              <p class="text-gray-500 mt-0.5 text-xs sm:text-sm hidden sm:block">Les meilleures selections de nos clients</p>
            </div>
            <a routerLink="/products" class="text-primary-600 font-medium hover:underline flex items-center gap-1 text-sm">
              Voir tout
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          @if (featuredProducts().length > 0) {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
              @for (product of featuredProducts(); track product._id) {
                <app-product-card [product]="product"/>
              }
            </div>
          }
        </div>
      </section>

      <!-- Promo Banner -->
      <section class="py-6 sm:py-8">
        <div class="container mx-auto px-3 sm:px-4">
          <a routerLink="/products" [queryParams]="{onSale: true}" class="block relative rounded-2xl sm:rounded-3xl overflow-hidden group">
            <div class="bg-gradient-to-r from-red-600 to-red-700 px-5 sm:px-8 py-8 sm:py-12 flex items-center justify-between">
              <div>
                <span class="inline-block bg-white/20 text-white text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full mb-2 sm:mb-4">OFFRE LIMITÉE</span>
                <h2 class="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Hasta -50%</h2>
                <p class="text-red-100 text-xs sm:text-base">Sur une sélection de produits</p>
              </div>
              <div class="hidden sm:block">
                <div class="text-4xl lg:text-6xl font-bold text-white/20">SALE</div>
              </div>
            </div>
            <div class="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center group-hover:translate-x-2 transition flex-shrink-0">
              <svg class="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </div>
          </a>
        </div>
      </section>

      <!-- Flash Deals Section -->
      <section class="py-8 sm:py-12 bg-gradient-to-r from-orange-500 to-red-600">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-8">
            <div class="flex items-center gap-3 sm:gap-4">
              <div class="bg-white text-orange-600 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm0-8a1 1 0 011 1v4a1 1 0 01-2 0V5a1 1 0 011-1z"/>
                  </svg>
                  <span class="text-lg sm:text-2xl font-bold">⚡</span>
                </div>
              </div>
              <div>
                <h2 class="text-lg sm:text-2xl font-bold text-white">Offres Flash</h2>
                <p class="text-orange-100 text-xs sm:text-base">Ne manquez pas ces affaires limitées!</p>
              </div>
            </div>
            @if (flashDeals().length > 0 && flashDeals()[0].saleEndsAt) {
              <div class="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex-wrap">
                <span class="text-white text-xs sm:text-sm font-medium">Fin:</span>
                <span class="bg-white text-orange-600 font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">{{ getProductTimer(flashDeals()[0]._id).hours }}h</span>
                <span class="text-white">:</span>
                <span class="bg-white text-orange-600 font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">{{ getProductTimer(flashDeals()[0]._id).minutes }}m</span>
                <span class="text-white">:</span>
                <span class="bg-white text-orange-600 font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">{{ getProductTimer(flashDeals()[0]._id).seconds }}s</span>
              </div>
            }
          </div>

          @if (flashDeals().length > 0) {
            <div class="flex overflow-x-auto pb-2 gap-2 sm:gap-4 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible snap-x">
              @for (product of flashDeals(); track product._id) {
                <div class="flex-shrink-0 w-40 sm:w-auto snap-start">
                  <app-product-card [product]="product"/>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-6 sm:py-8">
              <p class="text-white/70 text-sm sm:text-lg">Revenez bientôt pour les prochaines offres flash!</p>
            </div>
          }

          <div class="text-center mt-6 sm:mt-8">
            <a routerLink="/products" [queryParams]="{onSale: true}" class="inline-flex items-center gap-2 bg-white text-orange-600 px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg text-sm sm:text-base">
              Voir toutes les offres
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <!-- New Arrivals -->
      <section class="py-10 sm:py-16 bg-gray-50">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900">Nouveautés</h2>
              <p class="text-gray-500 mt-0.5 text-xs sm:text-sm hidden sm:block">Les derniers ajouts à notre collection</p>
            </div>
            <a routerLink="/products" [queryParams]="{sort: '-createdAt'}" class="text-primary-600 font-medium hover:underline flex items-center gap-1 text-sm">
              Voir tout
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          
          @if (newProducts().length > 0) {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
              @for (product of newProducts(); track product._id) {
                <app-product-card [product]="product"/>
              }
            </div>
          }
        </div>
      </section>

      <!-- Bundles Section -->
      <section class="py-10 sm:py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-8">
            <div>
              <h2 class="text-lg sm:text-2xl font-bold text-white">Packs & Bundles</h2>
              <p class="text-indigo-100 mt-0.5 text-xs sm:text-base">Économisez plus avec nos packages</p>
            </div>
            <a routerLink="/bundles" class="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition text-sm whitespace-nowrap">
              Voir tout
            </a>
          </div>
          <div class="flex overflow-x-auto pb-2 gap-3 sm:gap-6 md:grid md:grid-cols-3 md:overflow-visible snap-x">
            @for (bundle of bundles(); track bundle._id) {
              <div class="flex-shrink-0 w-64 sm:w-auto snap-start bg-white rounded-xl p-4 hover:shadow-lg transition">
                <h3 class="font-bold text-gray-900 mb-2">{{ bundle.name }}</h3>
                <p class="text-sm text-gray-500 mb-3 line-clamp-2">{{ bundle.description }}</p>
                <div class="flex items-baseline gap-2 mb-3 flex-wrap">
                  <span class="text-lg sm:text-xl font-bold text-indigo-600">{{ bundle.pricing.price | number:'1.3' }} DT</span>
                  @if (bundle.pricing.originalPrice > bundle.pricing.price) {
                    <span class="text-xs text-gray-400 line-through">{{ bundle.pricing.originalPrice | number:'1.3' }}</span>
                    <span class="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">-{{ bundle.pricing.discountPercentage }}%</span>
                  }
                </div>
                <a [routerLink]="['/bundles']" class="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                  Voir le pack
                </a>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Why Choose Us -->
      <section class="py-10 sm:py-16 bg-white">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Pourquoi choisir Tunisia Store?</h2>
              <div class="space-y-4 sm:space-y-6">
                @for (item of whyUs; track item.title) {
                  <div class="flex gap-3 sm:gap-4">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg sm:rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                      <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900 text-sm sm:text-base">{{ item.title }}</h3>
                      <p class="text-gray-500 text-xs sm:text-sm">{{ item.desc }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="relative">
              <div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white">
                <div class="text-center">
                  <div class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-1 sm:mb-2">4.9</div>
                  <div class="flex justify-center gap-1 mb-2 sm:mb-4">
                    @for (star of [1,2,3,4,5]; track star) {
                      <svg class="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    }
                  </div>
                  <div class="text-sm sm:text-lg font-medium">Note moyenne</div>
                  <div class="text-primary-200 text-xs sm:text-base">Basé sur 500+ avis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- Contact CTA -->
      <section class="py-10 sm:py-16 bg-gray-900">
        <div class="container mx-auto px-3 sm:px-4">
          <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center text-white flex flex-col items-center">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 backdrop-blur-sm">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 class="text-xl sm:text-2xl lg:text-4xl font-bold mb-2 sm:mb-4">Besoin d'aide ?</h2>
            <p class="text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-lg">
              Notre équipe de service client est à votre disposition pour répondre à toutes vos questions, vous conseiller ou vous accompagner dans vos achats.
            </p>
            <a routerLink="/contact" class="inline-flex items-center gap-2 bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-sm sm:text-base">
              Nous contacter
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private seo = inject(SeoService);
  private http = inject(HttpClient);
  
  featuredProducts = signal<Product[]>([]);
  newProducts = signal<Product[]>([]);
  bundles = signal<any[]>([]);
  flashDeals = signal<Product[]>([]);

  productTimers = new Map<string, { days: number; hours: number; minutes: number; seconds: number }>();
  private countdownInterval: any;

  features = [
    { icon: '🚚', title: 'Livraison rapide', desc: '24-48h dans le Grand Tunis' },
    { icon: '🔒', title: 'Paiement sécurisé', desc: 'Paiement à la livraison' },
    { icon: '✅', title: 'Produits authentiques', desc: 'Garantie constructeur' },
    { icon: '🔄', title: 'Retour facile', desc: '7 jours pour changer d\'avis' }
  ];

  categories = [
    { name: 'Smartphones', icon: '📱', slug: 'smartphones' },
    { name: 'Ordinateurs', icon: '💻', slug: 'computers' },
    { name: 'Tablettes', icon: '📲', slug: 'tablets' },
    { name: 'Accessoires', icon: '🎧', slug: 'accessories' },
    { name: 'Montres', icon: '⌚', slug: 'wearables' },
    { name: 'Gaming', icon: '🎮', slug: 'gaming' }
  ];

  whyUs = [
    { title: 'Produits 100% authentiques', desc: 'Tous nos produits sont originaux avec garantie constructeur' },
    { title: 'Support client dédié', desc: 'Notre équipe est disponible pour vous aider 7j/7' },
    { title: 'Livraison express', desc: 'Recevez vos commandes en 24-48h maximum' },
    { title: 'Paiement à la livraison', desc: 'Payez uniquement quand vous recevez votre commande' }
  ];

  ngOnInit() {
    this.seo.updateMeta({
    title: 'Accueil',
    description: 'Tunisia Store - Votre boutique en ligne pour smartphones, ordinateurs et électronique en Tunisie.'
  });
    this.loadFeaturedProducts();
    this.loadNewProducts();
    this.loadBundles();
    this.loadFlashDeals();
    this.startCountdown();
  }

  private loadBundles() {
    this.http.get<any>(`${environment.apiUrl}/bundles`).subscribe({
      next: (res) => this.bundles.set((res.bundles || []).slice(0, 3))
    });
  }

  private loadFeaturedProducts() {
    this.productService.getProducts({ featured: true, limit: 4 }).subscribe({
      next: (res) => this.featuredProducts.set(res.products)
    });
  }

   private loadNewProducts() {
     this.productService.getProducts({ sort: '-createdAt', limit: 4 }).subscribe({
       next: (res) => this.newProducts.set(res.products)
     });
   }

private loadFlashDeals() {
      this.productService.getProducts({ onSale: true, limit: 5, sort: 'price-asc' }).subscribe({
        next: (res) => this.flashDeals.set(res.products)
      });
    }

    private startCountdown() {
      // Update timer display every second
      this.updateProductTimers();
      // Refresh from backend every 15 seconds to get real-time data
      this.countdownInterval = setInterval(() => {
        this.updateProductTimers();
        this.loadFlashDealsRefresh();
      }, 15000);
    }

    private loadFlashDealsRefresh() {
      this.productService.getProducts({ onSale: true, limit: 5, sort: 'price-asc' }).subscribe({
        next: (res) => this.flashDeals.set(res.products)
      });
    }

    private updateProductTimers() {
      const activeProducts: Product[] = [];
      
      this.flashDeals().forEach(product => {
        if (product.saleEndsAt) {
          const endDate = new Date(product.saleEndsAt).getTime();
          const now = new Date().getTime();
          const distance = endDate - now;
          
          if (distance > 0) {
            this.productTimers.set(product._id, {
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
            activeProducts.push(product);
          } else {
            this.productTimers.delete(product._id);
          }
        } else if (product.badges?.includes('PROMO')) {
          this.productTimers.set(product._id, { days: 0, hours: 0, minutes: 0, seconds: 0 });
          activeProducts.push(product);
        }
      });
      
      if (activeProducts.length !== this.flashDeals().length) {
        this.flashDeals.set(activeProducts);
      }
    }

    getProductTimer(productId: string) {
      return this.productTimers.get(productId) || { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

getDiscount(product: Product): number {
      if (!product.pricing?.originalPrice) return 0;
      return Math.round(((product.pricing.originalPrice - product.pricing.price) / product.pricing.originalPrice) * 100);
    }

    getStockPercent(product: Product): number {
      const qty = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
      return Math.min(100, Math.max(0, (qty / 10) * 100));
    }

getStockLeft(product: Product): number {
      const qty = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
      return Math.max(0, qty);
    }
}