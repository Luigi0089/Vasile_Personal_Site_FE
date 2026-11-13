import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_PATHS } from '../Constants/ApiPaths';
import { Skill, SkillRequest } from '../DTO/Skill';
import { CategoryDto } from '../DTO/CategoryDto';
import { KeywordDto } from '../DTO/KeywordDto';
import { DashboardStatsDto } from '../DTO/DashboardStatsDto';
import {LezioneResponseDto} from "../DTO/LezioneResponseDto";
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

    return this.http.get(
      `${this.BASE}/conferma`,
      {
        params,
        responseType: 'text'
      }
    );
  }

  rifiutaLezione(id: string): Observable<string> {
    const params = new HttpParams().set('id', id);

    return this.http.get(
      `${this.BASE}/rifiuta`,
      {
        params,
        responseType: 'text'
      }
    );
  }

  wakeUp(): Observable<string> {
    return this.http.get(
      `${this.BASE}/ping`,
      {
        responseType: 'text'
      }
    );
  }

  // ======================
  //       SKILL
  // ======================

  createSkill(skill: SkillRequest): Observable<Skill> {
    return this.http.post<Skill>(
      `${this.BASE}/skills`,
      skill
    );
  }

  updateSkill(
    id: number,
    skill: SkillRequest
  ): Observable<Skill> {
    return this.http.put<Skill>(
      `${this.BASE}/skills/${id}`,
      skill
    );
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/skills/${id}`
    );
  }

  // ======================
  //       CATEGORY
  // ======================

  createCategory(name: string): Observable<CategoryDto> {
    const body: CategoryDto = {
      name
    };

    return this.http.post<CategoryDto>(
      `${this.BASE}/skills/categories`,
      body
    );
  }

  updateCategory(
    id: number,
    name: string
  ): Observable<CategoryDto> {
    const body: CategoryDto = {
      id,
      name
    };

    return this.http.put<CategoryDto>(
      `${this.BASE}/skills/categories/${id}`,
      body
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/skills/categories/${id}`
    );
  }

  // ======================
  //       KEYWORD
  // ======================

  createKeyword(value: string): Observable<KeywordDto> {
    const body: KeywordDto = {
      value
    };

    return this.http.post<KeywordDto>(
      `${this.BASE}/skills/keywords`,
      body
    );
  }

  updateKeyword(
    id: number,
    value: string
  ): Observable<KeywordDto> {
    const body: KeywordDto = {
      id,
      value
    };

    return this.http.put<KeywordDto>(
      `${this.BASE}/skills/keywords/${id}`,
      body
    );
  }

  deleteKeyword(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/skills/keywords/${id}`
    );
  }

  getDashboardStatistics(data: string): Observable<DashboardStatsDto> {
    const params = new HttpParams().set('data', data);
    return this.http.get<DashboardStatsDto>(
      `${this.BASE}/dashboard/stats`,
      {params}
    );
  }

  getLezioniConfermate(data: string): Observable<LezioneResponseDto[]> {
    const params = new HttpParams().set('data', data);
    return this.http.get<LezioneResponseDto[]>(
      `${this.BASE}/settimana/confermate`,
      {params}
    );
  }

  getLezioniDaConfermare(data: string): Observable<LezioneResponseDto[]> {
    const params = new HttpParams().set('data', data);
    return this.http.get<LezioneResponseDto[]>(
      `${this.BASE}/settimana/da/confermare`,
      {params}
    );
  }

  getLezioniDiProva(data: string): Observable<LezioneResponseDto[]> {
    const params = new HttpParams().set('data', data);
    return this.http.get<LezioneResponseDto[]>(
      `${this.BASE}/settimana/prova`,
      {params}
    );
  }
}
