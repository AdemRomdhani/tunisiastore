import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  streetAddress: string;
  postalCode?: string;
  additionalInfo?: string;
  isDefault: boolean;
  label: 'HOME' | 'WORK' | 'OTHER';
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/addresses`;
  
  addresses = signal<Address[]>([]);

  getAddresses(): Observable<{ success: boolean; addresses: Address[] }> {
    return this.http.get<{ success: boolean; addresses: Address[] }>(this.apiUrl).pipe(
      tap(res => this.addresses.set(res.addresses))
    );
  }

  createAddress(address: Omit<Address, '_id'>): Observable<{ success: boolean; address: Address }> {
    return this.http.post<{ success: boolean; address: Address }>(this.apiUrl, address);
  }

  updateAddress(id: string, address: Partial<Address>): Observable<{ success: boolean; address: Address }> {
    return this.http.put<{ success: boolean; address: Address }>(`${this.apiUrl}/${id}`, address);
  }

  deleteAddress(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  setDefaultAddress(id: string): Observable<{ success: boolean; address: Address }> {
    return this.http.put<{ success: boolean; address: Address }>(`${this.apiUrl}/${id}/default`, {});
  }
}