import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthStateService } from './auth-state.service';
import { environment } from '../../environments/environment';

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

/**
 * Handles authentication API calls and token management.
 * Bridges persistent token storage with reactive auth state.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = environment.apiUrl;

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

  /** Create a new account and return auth credentials. */
  signUp(userData: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/api/auth/sign-up`, userData);
  }

  /** Sign in and return auth credentials. */
  signIn(credentials: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/api/auth/sign-in`, credentials);
  }

  /** Persist token in a secure cookie with a 7-day expiration. */
  setToken(token: string, tokenType: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const fullToken = `${tokenType} ${token}`;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    document.cookie = `auth_token=${fullToken}; expires=${expirationDate.toUTCString()}; path=/; secure; SameSite=Strict`;
  }

  /** Read the auth token from cookie storage. */
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

  /** Remove the persisted auth token. */
  removeToken(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  /** Validate token with the server and update reactive auth state. */
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

    return this.http.get<ValidationResponse>(`${this.API_BASE_URL}/api/auth/validate`, {
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

  /** Initialize auth state from persisted token and validate if present. */
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

  /** Convenience sync check for presence of a token in the browser. */
  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.getToken() !== null;
  }

  /** Current reactive auth value snapshot. */
  getCurrentAuthState(): boolean {
    return this.authStateService.getCurrentAuthState();
  }

  /** Clear token and broadcast logged-out state. */
  logout(): void {
    this.removeToken();
    this.authStateService.setAuthenticationState(false);
  }

}