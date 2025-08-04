import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, SignInRequest } from '../../../services/authorization.service';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterModule, HttpClientModule],
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
    private router: Router
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
        
        // Store token in cookies
        this.authService.setToken(response.token, response.tokenType);
        
        this.isLoading = false;
        
        // Reset form
        this.resetForm();
        
        // Redirect to home page
        this.router.navigate(['/']);
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
        
        this.showError(errorMessage);
      }
    });
  }

  private showError(message: string): void {
    this.error = message;
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorElement && errorText) {
      errorText.textContent = message;
      errorElement.style.display = 'flex';
      
      // Hide error after 5 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }

  private resetForm(): void {
    this.usernameOrEmail = '';
    this.password = '';
    this.rememberMe = false;
    this.error = '';
  }
}