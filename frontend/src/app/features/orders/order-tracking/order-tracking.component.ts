import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="tracking-page">
      <div class="tracking-container">
        <h1>{{ 'tracking.title' | t }}</h1>
        <p class="subtitle">{{ 'tracking.subtitle' | t }}</p>
        
        <div class="tracking-form">
          <div class="form-group">
            <label>{{ 'tracking.orderNumber' | t }}</label>
            <input type="text" [(ngModel)]="orderNumber" [placeholder]="'tracking.orderPlaceholder' | t" class="form-control">
          </div>
          
          <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" [(ngModel)]="phone" placeholder="XX XXX XXX" class="form-control">
          </div>
          
          <button (click)="trackOrder()" [disabled]="loading || !orderNumber || !phone" class="btn-track">
            {{ loading ? 'common.loading' : 'tracking.trackButton' | t }}
          </button>
        </div>
        
        <div *ngIf="error" class="error-message">{{ error }}</div>
        
        <div *ngIf="order && !error" class="order-details">
          <div class="order-header">
            <h2>{{ 'orders.order' | t }} #{{ order.orderNumber }}</h2>
            <span class="status-badge" [class]="order.status?.toLowerCase()">{{ order.status }}</span>
          </div>
          
          <div class="order-timeline">
            <div class="timeline-item completed">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <h4>{{ 'tracking.orderPlaced' | t }}</h4>
                <p>{{ order.createdAt | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
            <div class="timeline-item" [class.completed]="order.status === 'CONFIRMED' || order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'">
              <div class="timeline-dot"></div>
              <div class="timeline-content"><h4>Confirmée</h4><p>Votre commande a été confirmée</p></div>
            </div>
            <div class="timeline-item" [class.completed]="order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'">
              <div class="timeline-dot"></div>
              <div class="timeline-content"><h4>En préparation</h4><p>Votre commande est en cours de préparation</p></div>
            </div>
            <div class="timeline-item" [class.completed]="order.status === 'SHIPPED' || order.status === 'DELIVERED'">
              <div class="timeline-dot"></div>
              <div class="timeline-content"><h4>Expédiée</h4><p *ngIf="order.shipping?.shippedAt">{{ order.shipping.shippedAt | date:'dd/MM/yyyy' }}</p></div>
            </div>
            <div class="timeline-item" [class.completed]="order.status === 'DELIVERED'">
              <div class="timeline-dot"></div>
              <div class="timeline-content"><h4>Livrée</h4><p *ngIf="order.shipping?.deliveredAt">{{ order.shipping.deliveredAt | date:'dd/MM/yyyy' }}</p></div>
            </div>
          </div>
          
          <div class="order-summary">
            <h3>Récapitulatif</h3>
            <div class="summary-row"><span>Sous-total</span><span>{{ order.pricing?.subtotal | number:'1.3-3' }} TND</span></div>
            <div class="summary-row"><span>Livraison</span><span>{{ order.pricing?.shipping > 0 ? (order.pricing.shipping | number:'1.3-3') + ' TND' : 'Gratuite' }}</span></div>
            <div class="summary-row" *ngIf="order.pricing?.discount > 0"><span>Réduction</span><span>-{{ order.pricing.discount | number:'1.3-3' }} TND</span></div>
            <div class="summary-row"><span>Montant HT</span><span>{{ order.pricing?.ht | number:'1.3-3' }} TND</span></div>
            <div class="summary-row"><span>TVA (19%)</span><span>{{ order.pricing?.tva | number:'1.3-3' }} TND</span></div>
            <div class="summary-row" *ngIf="order.pricing?.timbre > 0"><span>Timbre</span><span>{{ order.pricing?.timbre | number:'1.3-3' }} TND</span></div>
            <div class="summary-row total"><span>Total TTC</span><span>{{ order.pricing?.total | number:'1.3-3' }} TND</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-page { min-height: 100vh; background: #f8f9fa; padding: 40px 20px; }
    .tracking-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { margin: 0 0 8px; color: #333; font-size: 28px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .tracking-form { margin-bottom: 30px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
    .form-control { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; }
    .form-control:focus { outline: none; border-color: #667eea; }
    .btn-track { width: 100%; padding: 14px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .btn-track:hover:not(:disabled) { background: #5568d3; }
    .btn-track:disabled { background: #ccc; cursor: not-allowed; }
    .error-message { padding: 16px; background: #fee; color: #c00; border-radius: 8px; margin-bottom: 20px; }
    .order-details { margin-top: 30px; }
    .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    .order-header h2 { margin: 0; font-size: 20px; }
    .status-badge { padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; text-transform: uppercase; }
    .status-badge.pending { background: #fff3cd; color: #856404; }
    .status-badge.confirmed { background: #cce5ff; color: #004085; }
    .status-badge.processing { background: #d1ecf1; color: #0c5460; }
    .status-badge.shipped { background: #d4edda; color: #155724; }
    .status-badge.delivered { background: #c3e6cb; color: #155724; }
    .order-timeline { position: relative; margin-bottom: 30px; }
    .order-timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e9ecef; }
    .timeline-item { position: relative; padding-left: 50px; padding-bottom: 30px; opacity: 0.5; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item.completed { opacity: 1; }
    .timeline-dot { position: absolute; left: 8px; width: 16px; height: 16px; border-radius: 50%; background: #e9ecef; border: 3px solid white; box-shadow: 0 0 0 2px #e9ecef; }
    .timeline-item.completed .timeline-dot { background: #28a745; box-shadow: 0 0 0 2px #28a745; }
    .timeline-content h4 { margin: 0 0 4px; font-size: 16px; color: #333; }
    .timeline-content p { margin: 0; font-size: 14px; color: #666; }
    .order-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .order-summary h3 { margin: 0 0 16px; font-size: 16px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .summary-row.total { border-top: 1px solid #ddd; margin-top: 8px; padding-top: 16px; font-weight: 600; font-size: 18px; }
  `]
})
export class OrderTrackingComponent implements OnInit {
  orderNumber = '';
  phone = '';
  loading = false;
  error = '';
  order: any = null;

  constructor(
    private orderService: OrderService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['orderNumber']) {
        this.orderNumber = params['orderNumber'];
      }
      if (params['phone']) {
        this.phone = params['phone'];
      }
      if (this.orderNumber && this.phone) {
        this.trackOrder();
      }
    });
  }

  trackOrder() {
    if (!this.orderNumber || !this.phone) return;
    this.loading = true;
    this.error = '';
    this.order = null;
    
    this.orderService.trackOrder(this.orderNumber, undefined, this.phone).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.order = res.order;
        } else {
          this.error = res.message || 'Commande non trouvée';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors du suivi de la commande';
      }
    });
  }
}