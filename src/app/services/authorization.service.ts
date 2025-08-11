import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthStateService } from './auth-state.service';

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: string | null;
}

export interface SignUpRequest {
  email: string;
  username: string;
  name: string;
  password: string;
  location: string;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioLink?: string | null;
}

export interface SignInRequest {
  usernameOrEmail: string;
  password: string;
}

export interface ValidationResponse {
  valid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:8080/api/auth';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authStateService: AuthStateService
  ) {
    this.initializeAuthState();
  }

  get isAuthenticated$() {
    return this.authStateService.isAuthenticated$;
  }

  signUp(userData: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/sign-up`, userData);
  }

  signIn(credentials: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/login`, credentials);
  }

  setToken(token: string, tokenType: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const fullToken = `${tokenType} ${token}`;
    // Set cookie with 7 days expiration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    document.cookie = `auth_token=${fullToken}; expires=${expirationDate.toUTCString()}; path=/; secure; SameSite=Strict`;
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    const name = 'auth_token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    
    for (let cookie of cookieArray) {
      let c = cookie.trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  removeToken(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  validateToken(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      this.authStateService.setAuthenticationState(false);
      return of(false);
    }

    const token = this.getToken();
    if (!token) {
      this.authStateService.setAuthenticationState(false);
      return of(false);
    }

    return this.http.get<ValidationResponse>(`${this.API_BASE_URL}/validate`, {
      headers: { 'Authorization': token }
    }).pipe(
      map(response => response.valid),
      tap(isValid => {
        this.authStateService.setAuthenticationState(isValid);
        if (!isValid) {
          this.removeToken();
        }
      }),
      catchError(() => {
        this.authStateService.setAuthenticationState(false);
        this.removeToken();
        return of(false);
      })
    );
  }

  private initializeAuthState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.authStateService.setAuthenticationState(false);
      return;
    }
    
    const hasToken = this.getToken() !== null;
    this.authStateService.setAuthenticationState(hasToken);
    
    if (hasToken) {
      this.validateToken().subscribe();
    }
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.getToken() !== null;
  }

  getCurrentAuthState(): boolean {
    return this.authStateService.getCurrentAuthState();
  }

  logout(): void {
    this.removeToken();
    this.authStateService.setAuthenticationState(false);
  }

}