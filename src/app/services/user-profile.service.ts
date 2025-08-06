import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { UserProfile } from '../features/dashboard/user-profile.interface';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getUserProfile(): Observable<UserProfile> {
    const token = this.getTokenFromCookies();
    
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.get<UserProfile>(`${this.apiUrl}/get-user`, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  private getTokenFromCookies(): string {
    // Only access cookies in browser environment
    if (isPlatformBrowser(this.platformId)) {
      const tokenNames = ['auth_token', 'token', 'authToken', 'jwt', 'access_token'];
      
      for (const tokenName of tokenNames) {
        const token = this.getCookie(tokenName);
        if (token) {
          return token.startsWith('Bearer ') ? token.substring(7) : token;
        }
      }
    }

    // Try localStorage and sessionStorage (also browser-only)
    if (isPlatformBrowser(this.platformId)) {
      const localStorageToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (localStorageToken) {
        return localStorageToken.startsWith('Bearer ') ? localStorageToken.substring(7) : localStorageToken;
      }

      const sessionStorageToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (sessionStorageToken) {
        return sessionStorageToken.startsWith('Bearer ') ? sessionStorageToken.substring(7) : sessionStorageToken;
      }
    }

    return '';
  }

  private getCookie(name: string): string {
    // Only access document in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return '';
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Authentication failed. Please login again.';
          // Optionally redirect to login page
          // this.router.navigate(['/login']);
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission.';
          break;
        case 404:
          errorMessage = 'User profile not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('UserProfileService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
