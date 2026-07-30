import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_PATHS } from '../Constants/ApiPaths';
import { LoginRequest } from '../DTO/LoginRequest';
import { LoginResponse } from '../DTO/LoginResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly STORAGE_KEY = 'admin-session';

  constructor(private http: HttpClient) {}

  login(
    request: LoginRequest
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${API_PATHS.AUTH}/login`,
        request
      )
      .pipe(
        tap(response => this.saveSession(response))
      );
  }

  logout(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  getUsername(): string | null {
    return this.getSession()?.username ?? null;
  }

  getRole(): string | null {
    return this.getSession()?.role ?? null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  isAdmin(): boolean {
    return (
      this.isAuthenticated() &&
      this.getRole() === 'ADMIN'
    );
  }

  private saveSession(response: LoginResponse): void {
    sessionStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(response)
    );
  }

  private getSession(): LoginResponse | null {
    const storedSession =
      sessionStorage.getItem(this.STORAGE_KEY);

    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession) as LoginResponse;
    } catch {
      this.logout();
      return null;
    }
  }
}
