import { Injectable } from '@angular/core';
import { API_PATHS } from '../Constants/ApiPaths';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../DTO/Skill';
import { CategoryDto } from '../DTO/CategoryDto';
import { KeywordDto } from '../DTO/KeywordDto';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly BASE = API_PATHS.ADMIN;

  constructor(private http: HttpClient) {}

  // ======================
  //       LEZIONI
  // ======================

  accettaLezione(id: string): Observable<string> {
    const params = new HttpParams().set('id', id);
    return this.http.get(`${this.BASE}/conferma`, {
      params,
      responseType: 'text'
    });
  }

  rifiutaLezione(id: string): Observable<string> {
    const params = new HttpParams().set('id', id);
    return this.http.get(`${this.BASE}/rifiuta`, {
      params,
      responseType: 'text'
    });
  }

  wakeUp(): Observable<string> {
    return this.http.get(`${this.BASE}/ping`, { responseType: 'text' });
  }

  // ======================
  //       SKILL – ADMIN
  // ======================

  createSkill(skill: Skill, password: string): Observable<Skill> {
    const params = new HttpParams().set('password', password);
    return this.http.post<Skill>(`${this.BASE}/skills`, skill, { params });
  }

  updateSkill(id: number, skill: Skill, password: string): Observable<Skill> {
    const params = new HttpParams().set('password', password);
    return this.http.put<Skill>(`${this.BASE}/skills/${id}`, skill, { params });
  }

  deleteSkill(id: number, password: string): Observable<void> {
    const params = new HttpParams().set('password', password);
    return this.http.delete<void>(`${this.BASE}/skills/${id}`, { params });
  }

  // ======================
  //    CATEGORY – ADMIN
  // ======================

  createCategory(name: string, password: string): Observable<CategoryDto> {
    const params = new HttpParams().set('password', password);
    const body: CategoryDto = { name };
    return this.http.post<CategoryDto>(`${this.BASE}/skills/categories`, body, { params });
  }

  updateCategory(id: number, name: string, password: string): Observable<CategoryDto> {
    const params = new HttpParams().set('password', password);
    const body: CategoryDto = { id, name };
    return this.http.put<CategoryDto>(`${this.BASE}/skills/categories/${id}`, body, { params });
  }

  deleteCategory(id: number, password: string): Observable<void> {
    const params = new HttpParams().set('password', password);
    return this.http.delete<void>(`${this.BASE}/skills/categories/${id}`, { params });
  }

  // ======================
  //     KEYWORD – ADMIN
  // ======================

  createKeyword(value: string, password: string): Observable<KeywordDto> {
    const params = new HttpParams().set('password', password);
    const body: KeywordDto = { value };
    return this.http.post<KeywordDto>(`${this.BASE}/skills/keywords`, body, { params });
  }

  updateKeyword(id: number, value: string, password: string): Observable<KeywordDto> {
    const params = new HttpParams().set('password', password);
    const body: KeywordDto = { id, value };
    return this.http.put<KeywordDto>(`${this.BASE}/skills/keywords/${id}`, body, { params });
  }

  deleteKeyword(id: number, password: string): Observable<void> {
    const params = new HttpParams().set('password', password);
    return this.http.delete<void>(`${this.BASE}/skills/keywords/${id}`, { params });
  }
}
