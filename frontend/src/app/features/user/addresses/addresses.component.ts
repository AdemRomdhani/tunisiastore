import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AddressService, Address } from '../../../core/services/address.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { GOVERNORATES } from '../../../shared/constants/governorates';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-8 min-h-screen">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ 'addresses.title' | t }}</h1>
        <button (click)="openForm()" class="btn-primary">
          {{ 'addresses.addAddress' | t }}
        </button>
      </div>

      @if (loading()) {
        <app-skeleton type="card" [count]="4"/>
      } @else if (addresses().length === 0) {
        <div class="bg-white rounded-xl shadow-sm p-16 text-center">
          <p class="text-gray-500 text-lg mb-4">{{ 'addresses.noAddresses' | t }}</p>
          <button (click)="openForm()" class="btn-primary inline-block">
            {{ 'addresses.addAddress' | t }}
          </button>
        </div>
      } @else {
        <div class="grid md:grid-cols-2 gap-4">
          @for (addr of addresses(); track addr._id) {
            <div class="bg-white rounded-xl shadow-sm p-6 relative">
              @if (addr.isDefault) {
                <span class="absolute top-4 right-4 bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium">
                  Par défaut
                </span>
              }
              
              <div class="mb-4">
                <span class="text-xs uppercase text-gray-500">{{ addr.label }}</span>
                <p class="font-bold text-lg">{{ addr.fullName }}</p>
              </div>
              
              <div class="text-gray-600 space-y-1">
                <p>{{ addr.streetAddress }}</p>
                <p>{{ addr.city }}, {{ addr.governorate }}</p>
                <p>{{ addr.phone }}</p>
              </div>
              
              <div class="mt-4 pt-4 border-t flex gap-3">
                <button (click)="editAddress(addr)" class="text-sm text-primary-600 hover:text-primary-700">
                  Modifier
                </button>
                @if (!addr.isDefault && addr._id) {
                  <button (click)="setDefault(addr._id!)" class="text-sm text-gray-600 hover:text-gray-700">
                    Définir par défaut
                  </button>
                  <button (click)="deleteAddress(addr._id!)" class="text-sm text-red-600 hover:text-red-700">
                    Supprimer
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-lg font-bold mb-4">
              {{ editingAddress() ? 'Modifier l\'adresse' : 'Ajouter une adresse' }}
            </h3>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input type="text" [(ngModel)]="formData.fullName" class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" [(ngModel)]="formData.phone" class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Gouvernorat</label>
                <select [(ngModel)]="formData.governorate" class="input-field">
                  <option value="">Sélectionner</option>
                  @for (gov of governorates; track gov) {
                    <option [value]="gov">{{ gov }}</option>
                  }
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input type="text" [(ngModel)]="formData.city" class="input-field">
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" [(ngModel)]="formData.streetAddress" class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input type="text" [(ngModel)]="formData.postalCode" class="input-field">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Étiquette</label>
                <select [(ngModel)]="formData.label" class="input-field">
                  <option value="HOME">Maison</option>
                  <option value="WORK">Travail</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              
              <div class="md:col-span-2">
                <label class="flex items-center gap-2">
                  <input type="checkbox" [(ngModel)]="formData.isDefault" class="rounded text-primary-600">
                  <span class="text-sm text-gray-700">Définir comme adresse par défaut</span>
                </label>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" (click)="closeForm()" class="btn-secondary flex-1">Annuler</button>
              <button type="button" (click)="saveAddress()" [disabled]="saving()" class="btn-primary flex-1">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AddressesComponent implements OnInit {
  private addressService = inject(AddressService);
  private toast = inject(ToastService);

  addresses = signal<Address[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingAddress = signal<Address | null>(null);

  governorates = GOVERNORATES;

  formData: Partial<Address> = this.getEmptyForm();

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (res) => {
        this.addresses.set(res.addresses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getEmptyForm(): Partial<Address> {
    return {
      fullName: '',
      phone: '',
      governorate: '',
      city: '',
      streetAddress: '',
      postalCode: '',
      label: 'HOME',
      isDefault: false
    };
  }

  openForm() {
    this.formData = this.getEmptyForm();
    this.editingAddress.set(null);
    this.showForm.set(true);
  }

  editAddress(addr: Address) {
    this.formData = { ...addr };
    this.editingAddress.set(addr);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.formData = this.getEmptyForm();
    this.editingAddress.set(null);
  }

  saveAddress() {
    this.saving.set(true);
    const isEdit = this.editingAddress();
    
    const request = isEdit
      ? this.addressService.updateAddress(isEdit._id!, this.formData)
      : this.addressService.createAddress(this.formData as Omit<Address, '_id'>);

    request.subscribe({
      next: () => {
        this.toast.success('Succès', isEdit ? 'Adresse mise à jour' : 'Adresse ajoutée');
        this.loadAddresses();
        this.closeForm();
      },
      error: (err) => {
        this.toast.error('Erreur', err.error?.message || 'Erreur');
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      }
    });

    setTimeout(() => {
      if (this.saving()) {
        this.saving.set(false);
      }
    }, 10000);
  }

  setDefault(id: string) {
    this.addressService.setDefaultAddress(id).subscribe({
      next: () => {
        this.toast.success('Succès', 'Adresse par défaut définie');
        this.loadAddresses();
      }
    });
  }

  deleteAddress(id: string) {
    if (!confirm('Supprimer cette adresse?')) return;
    
    this.addressService.deleteAddress(id).subscribe({
      next: () => {
        this.toast.success('Succès', 'Adresse supprimée');
        this.loadAddresses();
      }
    });
  }
}