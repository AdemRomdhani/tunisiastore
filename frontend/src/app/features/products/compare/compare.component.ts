import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompareService } from '../../../core/services/compare.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterModule, ImageUrlPipe, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-8 min-h-screen">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ 'compare.title' | t }}</h1>
        @if (compareService.count() > 0) {
          <button 
            (click)="clearCompare()"
            class="text-sm text-red-600 hover:text-red-800"
          >
            {{ 'common.clear' | t }}
          </button>
        }
      </div>

      @if (compareService.products().length === 0) {
        <div class="bg-white rounded-xl shadow-sm p-16 text-center">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <p class="text-gray-500 text-lg mb-4">Aucun produit à comparer</p>
          <a routerLink="/products" class="btn-primary inline-block">Ajouter des produits</a>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px] bg-white rounded-xl shadow-sm">
            <thead>
              <tr>
                <th class="p-4 text-left bg-gray-50 w-48"></th>
                @for (product of compareService.products(); track product._id) {
                  <th class="p-4 bg-gray-50 relative">
                    <button 
                      (click)="remove(product._id)"
                      class="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full 
                             hover:bg-red-200 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                    <img [src]="product.media.images[0] | imageUrl" [alt]="product.name" class="w-32 h-32 object-contain mx-auto mb-2" width="128" height="128">
                    <a [routerLink]="['/product', product.slug]" class="text-sm font-medium text-gray-800 hover:text-primary-600">
                      {{ product.name }}
                    </a>
                  </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr>
                <td class="p-4 font-medium text-gray-600">Prix</td>
                @for (product of compareService.products(); track product._id) {
                  <td class="p-4">
                    <span class="text-xl font-bold text-primary-600">
                      {{ product.pricing.price | number:'1.3-3' }} DT
                    </span>
                    @if (product.pricing.originalPrice) {
                      <span class="text-sm text-gray-400 line-through ml-2">
                        {{ product.pricing.originalPrice | number:'1.3-3' }}
                      </span>
                    }
                  </td>
                }
              </tr>
              <tr>
                <td class="p-4 font-medium text-gray-600">Disponibilité</td>
                @for (product of compareService.products(); track product._id) {
                  <td class="p-4">
                    <span [class]="getStockClass(product)">
                      {{ getStockStatus(product) }}
                    </span>
                  </td>
                }
              </tr>
              <tr>
                <td class="p-4 font-medium text-gray-600">Catégorie</td>
                @for (product of compareService.products(); track product._id) {
                  <td class="p-4 text-sm">
                    {{ product.category.name || '—' }}
                  </td>
                }
              </tr>
              <tr>
                <td class="p-4 font-medium text-gray-600">Description</td>
                @for (product of compareService.products(); track product._id) {
                  <td class="p-4 text-sm text-gray-600">
                    {{ product.shortDescription || product.description || '—' | slice:0:150 }}{{ (product.shortDescription || product.description || '').length > 150 ? '...' : '' }}
                  </td>
                }
              </tr>
              <tr>
                <td class="p-4 font-medium text-gray-600">Note</td>
                @for (product of compareService.products(); track product._id) {
                  <td class="p-4">
                    <div class="flex items-center gap-1">
                      <div class="flex text-yellow-400">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg class="w-4 h-4" [class.text-gray-300]="star > (product.ratings.average || 0)" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        }
                      </div>
                      <span class="text-sm text-gray-500">({{ product.ratings.count || 0 }})</span>
                    </div>
                  </td>
                }
              </tr>
              <tr>
                <td class="p-4 font-medium text-gray-600">Actions</td>
                @for (product of compareService.products(); track product._id) {
                  <td class="p-4">
                    <a [routerLink]="['/product', product.slug]" class="btn-primary text-sm w-full block text-center">
                      Voir détails
                    </a>
                  </td>
                }
              </tr>
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class CompareComponent {
  compareService = inject(CompareService);

  remove(productId: string) {
    this.compareService.removeFromCompare(productId);
  }

  clearCompare() {
    this.compareService.clearCompare();
  }

  getStockClass(product: any): string {
    const qty = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
    if (qty <= 0) return 'text-red-600 font-medium';
    if (qty <= 5) return 'text-orange-600 font-medium';
    return 'text-green-600 font-medium';
  }

  getStockStatus(product: any): string {
    const qty = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
    if (qty <= 0) return 'Rupture de stock';
    if (qty <= 5) return `Plus que ${qty} en stock`;
    return 'En stock';
  }
}