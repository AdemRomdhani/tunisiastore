import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
  isActive: boolean;
  order: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<{ success: boolean; categories: Category[] }> {
    return this.http.get<any>(this.apiUrl);
  }

  getCategory(id: string): Observable<{ success: boolean; category: Category }> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCategory(data: Partial<Category>): Observable<{ success: boolean; category: Category }> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateCategory(id: string, data: Partial<Category>): Observable<{ success: boolean; category: Category }> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteCategory(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}