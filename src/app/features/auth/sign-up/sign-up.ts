import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import {
  AuthService,
  SignUpRequest,
} from '../../../services/authorization.service';

/**
 * Sign-up component with client-side validation and helpful error mapping.
 */
@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterModule, HttpClientModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  email: string = '';
  username: string = '';
  name: string = '';
  password: string = '';
  confirmPassword: string = '';
  location: string = '';
  githubUsername: string = '';
  linkedinUsername: string = '';
  portfolioUrl: string = '';
  termsAccepted: boolean = false;
  error: string = '';
  isLoading: boolean = false;

  // Form validation states
  formErrors: { [key: string]: string } = {};
  touchedFields: { [key: string]: boolean } = {};
  showError: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {}

  // Field validation methods
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  validateUrl(url: string): boolean {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Mark field as touched
  markFieldAsTouched(fieldName: string): void {
    this.touchedFields[fieldName] = true;
    this.validateField(fieldName);
  }

  // Validate individual field
  validateField(fieldName: string): void {
    delete this.formErrors[fieldName];

    switch (fieldName) {
      case 'name':
        if (!this.name.trim()) {
          this.formErrors[fieldName] = 'Name is required';
        } else if (this.name.trim().length < 2) {
          this.formErrors[fieldName] = 'Name must be at least 2 characters';
        }
        break;
      case 'username':
        if (!this.username.trim()) {
          this.formErrors[fieldName] = 'Username is required';
        } else if (!this.validateUsername(this.username)) {
          this.formErrors[fieldName] =
            'Username must be 3-20 characters and contain only letters, numbers, and underscores';
        }
        break;
      case 'email':
        if (!this.email.trim()) {
          this.formErrors[fieldName] = 'Email is required';
        } else if (!this.validateEmail(this.email)) {
          this.formErrors[fieldName] = 'Please enter a valid email address';
        }
        break;
      case 'location':
        if (!this.location.trim()) {
          this.formErrors[fieldName] = 'Location is required';
        }
        break;
      case 'password':
        if (!this.password) {
          this.formErrors[fieldName] = 'Password is required';
        } else if (!this.validatePassword(this.password)) {
          this.formErrors[fieldName] =
            'Password must be at least 8 characters long';
        }
        break;
      case 'confirmPassword':
        if (!this.confirmPassword) {
          this.formErrors[fieldName] = 'Please confirm your password';
        } else if (this.password !== this.confirmPassword) {
          this.formErrors[fieldName] = 'Passwords do not match';
        }
        break;
      case 'portfolioUrl':
        if (this.portfolioUrl && !this.validateUrl(this.portfolioUrl)) {
          this.formErrors[fieldName] = 'Please enter a valid URL';
        }
        break;
    }
  }

  // Validate entire form
  validateForm(): boolean {
    const fields = [
      'name',
      'username',
      'email',
      'location',
      'password',
      'confirmPassword',
      'portfolioUrl',
    ];
    let isValid = true;

    // Mark all fields as touched
    fields.forEach((field) => {
      this.touchedFields[field] = true;
      this.validateField(field);
    });

    // Check if any errors exist
    if (Object.keys(this.formErrors).length > 0) {
      isValid = false;
    }

    // Check terms acceptance
    if (!this.termsAccepted) {
      this.formErrors['terms'] =
        'Please accept the Terms of Service and Privacy Policy';
      isValid = false;
    }

    return isValid;
  }

  // Check if field has error and is touched
  hasFieldError(fieldName: string): boolean {
    return !!this.touchedFields[fieldName] && !!this.formErrors[fieldName];
  }

  // Get field error message
  getFieldError(fieldName: string): string {
    return this.formErrors[fieldName] || '';
  }

  // Hide error message
  hideError(): void {
    this.showError = false;
    this.error = '';
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.hideError();

    if (!this.validateForm()) {
      this.error = 'Please fix the errors below and try again';
      this.showError = true;
      return;
    }

    this.isLoading = true;

    // Build GitHub/LinkedIn URLs from provided usernames
    let githubUrl = null;
    if (this.githubUsername && this.githubUsername.trim()) {
      githubUrl = `https://github.com/${this.githubUsername.trim()}`;
    }

    let linkedinUrl = null;
    if (this.linkedinUsername && this.linkedinUsername.trim()) {
      linkedinUrl = `https://www.linkedin.com/in/${this.linkedinUsername.trim()}`;
    }

    const userData: SignUpRequest = {
      email: this.email.trim(),
      username: this.username.trim(),
      name: this.name.trim(),
      password: this.password,
      location: this.location.trim(),
      githubUrl,
      linkedinUrl,
      portfolioLink: this.portfolioUrl.trim() || null,
    };

    this.authService.signUp(userData).subscribe({
      next: (response) => {
        this.authService.setToken(response.token, response.tokenType);

        this.authService.validateToken().subscribe(() => {
          this.isLoading = false;
          this.resetForm();
          setTimeout(() => {
            this.router.navigate(['/parse-resume'], {
              state: { firstTime: true },
            });
          }, 1500);
        });
      },
      error: (error) => {
        console.error('Sign up error:', error);
        this.isLoading = false;

        this.handleSignUpError(error);
      },
    });
  }

  private handleSignUpError(error: any): void {
    let errorMessage = 'An error occurred during account creation';

    if (error.status === 400) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        // Map backend validation errors to local form state
        const backendErrors = error.error.errors;
        if (backendErrors.email) {
          this.formErrors['email'] = backendErrors.email[0];
          this.touchedFields['email'] = true;
        }
        if (backendErrors.username) {
          this.formErrors['username'] = backendErrors.username[0];
          this.touchedFields['username'] = true;
        }
        errorMessage = 'Please fix the highlighted errors';
      } else {
        errorMessage = 'Please check your input and try again';
      }
    } else if (error.status === 409) {
      if (error.error?.message?.includes('email')) {
        this.formErrors['email'] = 'This email is already registered';
        this.touchedFields['email'] = true;
        errorMessage = 'Email already exists';
      } else if (error.error?.message?.includes('username')) {
        this.formErrors['username'] = 'This username is already taken';
        this.touchedFields['username'] = true;
        errorMessage = 'Username already exists';
      } else {
        errorMessage = 'Username or email already exists';
      }
    } else if (error.status === 422) {
      errorMessage = 'Invalid data provided. Please check your information.';
    } else if (error.status === 429) {
      errorMessage = 'Too many attempts. Please try again later.';
    } else if (error.status === 0) {
      errorMessage =
        'Unable to connect to server. Please check your internet connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    this.error = errorMessage;
    this.showError = true;
    console.error('Auth error:', errorMessage);
  }

  private resetForm(): void {
    this.email = '';
    this.username = '';
    this.name = '';
    this.password = '';
    this.confirmPassword = '';
    this.linkedinUsername = '';
    this.location = '';
    this.githubUsername = '';
    this.portfolioUrl = '';
    this.termsAccepted = false;
    this.formErrors = {};
    this.touchedFields = {};
    this.showError = false;
    this.error = '';
  }
}
