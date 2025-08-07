import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService, SignInRequest } from '../../../services/authorization.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterModule, HttpClientModule, ToastModule],
  providers: [MessageService],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {
  usernameOrEmail: string = '';
  password: string = '';
  rememberMe: boolean = false;
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.error = '';

    const credentials: SignInRequest = {
      usernameOrEmail: this.usernameOrEmail,
      password: this.password
    };

    this.authService.signIn(credentials).subscribe({
      next: (response) => {
        console.log('Sign in successful:', response);
        
        this.authService.setToken(response.token, response.tokenType);
        
        this.authService.validateToken().subscribe(() => {
          this.isLoading = false;
          this.resetForm();
          this.toastService.showAuthSuccess('Welcome back! Redirecting to dashboard...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        });
      },
      error: (error) => {
        console.error('Sign in error:', error);
        this.isLoading = false;
        
        let errorMessage = 'An error occurred during sign in';
        if (error.status === 401) {
          errorMessage = 'Invalid username/email or password';
        } else if (error.status === 400) {
          errorMessage = 'Please check your input and try again';
        } else if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please try again later.';
        }
        
        this.toastService.showAuthError(errorMessage);
      }
    });
  }

  private resetForm(): void {
    this.usernameOrEmail = '';
    this.password = '';
    this.rememberMe = false;
    this.error = '';
  }
}