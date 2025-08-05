import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeAuthState();
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
      this.isAuthenticatedSubject.next(false);
      return of(false);
    }

    const token = this.getToken();
    if (!token) {
      this.isAuthenticatedSubject.next(false);
      return of(false);
    }

    return this.http.get<ValidationResponse>(`${this.API_BASE_URL}/validate`, {
      headers: { 'Authorization': token }
    }).pipe(
      map(response => response.valid),
      tap(isValid => {
        this.isAuthenticatedSubject.next(isValid);
        if (!isValid) {
          this.removeToken();
        }
      }),
      catchError(() => {
        this.isAuthenticatedSubject.next(false);
        this.removeToken();
        return of(false);
      })
    );
  }

  private initializeAuthState(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Set initial state based on token presence
      const hasToken = this.getToken() !== null;
      this.isAuthenticatedSubject.next(hasToken);
      
      // Then validate the token asynchronously
      if (hasToken) {
        this.validateToken().subscribe();
      }
    }
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getCurrentAuthState(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  logout(): void {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): Observable<any> {
    // Return mock user data for now - replace with actual API call
    return of({
      id: 1,
      username: 'John Doe',
      email: 'john@example.com',
      joinDate: new Date()
    });
  }
}