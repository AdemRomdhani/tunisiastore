import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  _id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuditStats {
  todayActions: number;
  totalActions: number;
  byResource: { [key: string]: number };
  byAction: { [key: string]: number };
  recentAdmins: {
    _id: string;
    adminName: string;
    actionCount: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private apiUrl = `${environment.apiUrl}/audit`;

  constructor(private http: HttpClient) {}

  getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Observable<AuditLogsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<AuditLogsResponse>(this.apiUrl, { params: httpParams });
  }

  getAuditStats(): Observable<{ success: boolean; stats: AuditStats }> {
    return this.http.get<{ success: boolean; stats: AuditStats }>(`${this.apiUrl}/stats`);
  }
}