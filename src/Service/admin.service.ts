import { Injectable } from '@angular/core';
import {API_PATHS} from "../Constants/ApiPaths";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly BASE = API_PATHS.ADMIN;

  constructor(private http: HttpClient) {}

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
}
