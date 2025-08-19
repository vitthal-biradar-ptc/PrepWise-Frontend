import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map, tap, shareReplay, finalize } from 'rxjs/operators';
import { UserProfile } from '../features/dashboard/user-profile.interface';
import { AuthService } from './authorization.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = environment.apiUrl;
  // In-memory cache and in-flight request reference
  private cachedProfile: UserProfile | null = null;
  private cachedUserId: string | null = null;
  private profileReq$?: Observable<UserProfile>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {}

  getUserProfile(): Observable<UserProfile> {
    const token = this.authService.getToken();
    
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': token,
      'Content-Type': 'application/json'
    });
    
    return this.http.get<UserProfile>(`${this.apiUrl}/apiget-user`, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updateUserProfile(profileData: any): Observable<UserProfile> {
    const token = this.authService.getToken();
    
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': token,
      'Content-Type': 'application/json'
    });
    
    return this.http.put<UserProfile>(`${this.apiUrl}/api/update-profile`, profileData, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // Fetch once per app load; reuse in-flight request and cache result in memory
  getUserProfileCached(): Observable<UserProfile> {
    if (this.cachedProfile) {
      return of(this.cachedProfile);
    }
    if (this.profileReq$) {
      return this.profileReq$;
    }
    this.profileReq$ = this.getUserProfile().pipe(
      tap(profile => {
        this.cachedProfile = profile;
        this.cachedUserId = profile?.user_id ?? null;
      }),
      shareReplay(1),
      finalize(() => {
        // Allow future refresh after completion (success or error)
        this.profileReq$ = undefined;
      })
    );
    return this.profileReq$;
  }

  getUserIdCached(): Observable<string | null> {
    if (this.cachedUserId) {
      return of(this.cachedUserId);
    }
    return this.getUserProfileCached().pipe(
      map(p => p?.user_id ?? null),
      tap(id => (this.cachedUserId = id))
    );
  }

  clearCache(): void {
    this.cachedProfile = null;
    this.cachedUserId = null;
    this.profileReq$ = undefined;
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