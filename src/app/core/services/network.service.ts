import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private _isOnline = signal(true);
  private _wasOffline = signal(false);

  readonly isOnline = this._isOnline.asReadonly();
  readonly wasOffline = this._wasOffline.asReadonly();

  constructor() {
    this.checkConnection();
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
  }

  private checkConnection() {
    this._isOnline.set(navigator.onLine);
  }

  private onOnline() {
    this._isOnline.set(true);
    if (this._wasOffline()) {
      this._wasOffline.set(false);
      window.location.reload();
    }
  }

  private onOffline() {
    this._isOnline.set(false);
    this._wasOffline.set(true);
  }

  async waitForOnline(timeout = 10000): Promise<boolean> {
    if (this._isOnline()) return true;

    return new Promise((resolve) => {
      const check = () => {
        if (this._isOnline()) {
          resolve(true);
          return;
        }
        setTimeout(check, 500);
      };
      setTimeout(() => resolve(false), timeout);
      check();
    });
  }
}