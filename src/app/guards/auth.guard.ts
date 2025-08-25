import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state.service';
import { AuthService } from '../services/authorization.service';

/**
 * Route guard ensuring a valid auth token before activating protected routes.
 * Redirects to sign-in when absent or invalid.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authStateService: AuthStateService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // First check if there's a token and validate it
    const token = this.authService.getToken();
    
    if (!token) {
      this.router.navigate(['/sign-in']);
      return of(false);
    }

    // If token exists, validate it and wait for the result
    return this.authService.validateToken().pipe(
      take(1),
      map(isValid => {
        if (isValid) {
          return true;
        } else {
          this.router.navigate(['/sign-in']);
          return false;
        }
      })
    );
  }
}