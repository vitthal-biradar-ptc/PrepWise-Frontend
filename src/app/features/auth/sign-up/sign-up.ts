import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, SignUpRequest } from '../../../services/authorization.service';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterModule, HttpClientModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {
  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  termsAccepted: boolean = false;
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

    // Validate username
    if (!this.username.trim()) {
      this.error = "Username is required";
      this.showError(this.error);
      this.isLoading = false;
      return;
    }

    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match";
      this.showError(this.error);
      this.isLoading = false;
      return;
    }

    // Validate terms acceptance
    if (!this.termsAccepted) {
      this.error = "Please accept the Terms of Service and Privacy Policy";
      this.showError(this.error);
      this.isLoading = false;
      return;
    }

    const userData: SignUpRequest = {
      email: this.email,
      username: this.username,
      password: this.password
    };

    this.authService.signUp(userData).subscribe({
      next: (response) => {
        console.log('Sign up successful:', response);
        
        // Store token in cookies
        this.authService.setToken(response.token, response.tokenType);
        
        this.isLoading = false;
        
        // Reset form
        this.resetForm();
        
        // Redirect to home page
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Sign up error:', error);
        this.isLoading = false;
        
        let errorMessage = 'An error occurred during account creation';
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Please check your input and try again';
        } else if (error.status === 409) {
          errorMessage = 'Username or email already exists';
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
    this.email = '';
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.termsAccepted = false;
    this.error = '';
  }
}