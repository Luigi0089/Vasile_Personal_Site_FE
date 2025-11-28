import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_PATHS } from '../Constants/ApiPaths';
import { Observable } from 'rxjs';
import { ProgettoDTO } from '../DTO/ProgettoDTO';
import { ReadmeDTO } from '../DTO/ReadmeDTO';
import { Skill } from '../DTO/Skill';
import { CategoryDto } from '../DTO/CategoryDto';
import { KeywordDto } from '../DTO/KeywordDto';

@Injectable({ providedIn: 'root' })
export class StackService {

  private readonly BASE = API_PATHS.STACK;

  constructor(private http: HttpClient) {}

  // ======================
  //       GITHUB
  // ======================

  getRepos(): Observable<ProgettoDTO[]> {
    return this.http.get<ProgettoDTO[]>(`${this.BASE}/progetti`);
  }

  getReadme(repoName: string): Observable<ReadmeDTO> {
    return this.http.get<ReadmeDTO>(`${this.BASE}/readme`, {
      params: { repoName }
    });
  }

  // ======================
  //        SKILL
  // ======================

  /**
   * Skill pubbliche per le card dello stack.
   */
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.BASE}/skills`);
  }

  /**
   * Tutte le categorie disponibili (per filtri / menu FE).
   */

  getCategories(): Observable<CategoryDto[]> {
    console.log("categorie:")
    return this.http.get<CategoryDto[]>(`${this.BASE}/categories`);
  }

  /**
   * Tutte le keyword disponibili (se ti serviranno come tag/filtri).
   */
  getSkillKeywords(): Observable<KeywordDto[]> {
    return this.http.get<KeywordDto[]>(`${this.BASE}/skills/keywords`);
  }
}
