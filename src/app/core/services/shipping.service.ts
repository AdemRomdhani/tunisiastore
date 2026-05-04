import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Carrier {
  id: string;
  name: string;
  nameAr: string;
  description: string;
}

export interface ShippingCost {
  baseCost: number;
  extraWeightCost: number;
  codFee: number;
  total: number;
  estimatedDays: string;
}

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private apiUrl = `${environment.apiUrl}/shipping`;

  constructor(private http: HttpClient) {}

  getCarriers(): Observable<{ success: boolean; carriers: Carrier[] }> {
    return this.http.get<any>(`${this.apiUrl}/carriers`);
  }

  getShippingCost(governorate: string, carrier?: string): Observable<{ 
    success: boolean; 
    cost: ShippingCost; 
    governorate: string; 
    carrier: string 
  }> {
    const url = carrier 
      ? `${this.apiUrl}/cost?governorate=${encodeURIComponent(governorate)}&carrier=${carrier}`
      : `${this.apiUrl}/cost?governorate=${encodeURIComponent(governorate)}`;
    return this.http.get<any>(url);
  }

  trackShipment(trackingNumber: string, carrier?: string): Observable<{ 
    success: boolean; 
    tracking: any 
  }> {
    return this.http.post<any>(`${this.apiUrl}/track`, { trackingNumber, carrier });
  }

  createShipment(orderId: string, carrier: string): Observable<{ 
    success: boolean; 
    shipment: any; 
    order: any 
  }> {
    return this.http.post<any>(`${this.apiUrl}/create`, { orderId, carrier });
  }
}