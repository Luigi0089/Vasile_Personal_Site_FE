import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_PATHS } from '../Constants/ApiPaths';
import {Observable} from "rxjs";
import {ProgettoDTO} from "../DTO/ProgettoDTO";
import {ReadmeDTO} from "../DTO/ReadmeDTO";


@Injectable({ providedIn: 'root' })
export class StackService {



  constructor(private http: HttpClient) {}

  getRepos():Observable<ProgettoDTO[]> {
    return this.http.get<ProgettoDTO[]>(API_PATHS.STACK+`/progetti`);
  }

  getReadme(repoName: string): Observable<ReadmeDTO> {
    return this.http.get<ReadmeDTO>(`${API_PATHS.STACK}/readme`, {
      params: { repoName }
    });
  }


}

