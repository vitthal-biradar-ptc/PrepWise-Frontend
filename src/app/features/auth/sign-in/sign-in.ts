import { Component, inject, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AuthService, SignInRequest } from '../../../services/authorization.service';

interface FormErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterModule, HttpClientModule, CommonModule],
  providers: [MessageService],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn implements OnDestroy {
  // Form data
  usernameOrEmail: string = '';
  password: string = '';
  rememberMe: boolean = false;

  // Form state
  isLoading: boolean = false;
  formErrors: FormErrors = {};
  touchedFields: TouchedFields = {};
  showError: boolean = false;
  generalError: string = '';
  showPassword: boolean = false;

  // Rate limiting
  attemptCount: number = 0;
  maxAttempts: number = 5;
  isBlocked: boolean = false;
  blockUntil: Date | null = null;

  private authService = inject(AuthService);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.checkIfBlocked();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Enhanced validation methods
  validateUsernameOrEmail(input: string): { valid: boolean; message?: string } {
    if (!input.trim()) {
      return { valid: false, message: 'Username or email is required' };
    }
    if (input.trim().length < 3) {
      return { valid: false, message: 'Username or email must be at least 3 characters' };
    }
    return { valid: true };
  }

  validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
    if (password.length < 1) {
      return { valid: false, message: 'Password cannot be empty' };
    }
    return { valid: true };
  }

  // Field validation
  markFieldAsTouched(fieldName: string): void {
    this.touchedFields[fieldName] = true;
    this.validateField(fieldName);
  }

  validateField(fieldName: string): void {
    delete this.formErrors[fieldName];

    let validation: { valid: boolean; message?: string };

    switch (fieldName) {
      case 'usernameOrEmail':
        validation = this.validateUsernameOrEmail(this.usernameOrEmail);
        break;
      case 'password':
        validation = this.validatePassword(this.password);
        break;
      default:
        return;
    }

    if (!validation.valid && validation.message) {
      this.formErrors[fieldName] = validation.message;
    }
  }

  // Computed property for form validity
  get isFormValid(): boolean {
    const usernameValid = this.validateUsernameOrEmail(this.usernameOrEmail).valid;
    const passwordValid = this.validatePassword(this.password).valid;
    return usernameValid && passwordValid;
  }

  // Form validation - make this pure (no side effects)
  private checkFormValidity(): boolean {
    const fields = ['usernameOrEmail', 'password'];
    let isValid = true;

    // Check if any errors exist
    if (Object.keys(this.formErrors).length > 0) {
      isValid = false;
    }

    // Validate each field without side effects
    for (const field of fields) {
      let validation: { valid: boolean; message?: string };
      
      switch (field) {
        case 'usernameOrEmail':
          validation = this.validateUsernameOrEmail(this.usernameOrEmail);
          break;
        case 'password':
          validation = this.validatePassword(this.password);
          break;
        default:
          continue;
      }

      if (!validation.valid) {
        isValid = false;
      }
    }

    return isValid;
  }

  // Enhanced validation for form submission
  validateFormForSubmission(): boolean {
    const fields = ['usernameOrEmail', 'password'];
    let isValid = true;

    // Mark all fields as touched and validate
    fields.forEach(field => {
      this.touchedFields[field] = true;
      this.validateField(field);
    });

    // Check if any errors exist
    if (Object.keys(this.formErrors).length > 0) {
      isValid = false;
    }

    return isValid;
  }

  // Helper methods
  hasFieldError(fieldName: string): boolean {
    return this.touchedFields[fieldName] && !!this.formErrors[fieldName];
  }

  getFieldError(fieldName: string): string {
    return this.formErrors[fieldName] || '';
  }

  hideError(): void {
    this.showError = false;
    this.generalError = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Rate limiting - with browser check
  checkIfBlocked(): void {
    if (!this.isBrowser) return;
    
    try {
      const blockData = localStorage.getItem('signInBlock');
      if (blockData) {
        const { until, attempts } = JSON.parse(blockData);
        this.blockUntil = new Date(until);
        this.attemptCount = attempts;
        
        if (new Date() < this.blockUntil) {
          this.isBlocked = true;
        } else {
          this.clearBlock();
        }
      }
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
    }
  }

  addFailedAttempt(): void {
    if (!this.isBrowser) return;
    
    this.attemptCount++;
    
    if (this.attemptCount >= this.maxAttempts) {
      this.blockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      this.isBlocked = true;
      
      try {
        localStorage.setItem('signInBlock', JSON.stringify({
          until: this.blockUntil.toISOString(),
          attempts: this.attemptCount
        }));
      } catch (error) {
        console.warn('Error setting localStorage:', error);
      }

    }
  }

  clearBlock(): void {
    this.attemptCount = 0;
    this.isBlocked = false;
    this.blockUntil = null;
    
    if (this.isBrowser) {
      try {
        localStorage.removeItem('signInBlock');
      } catch (error) {
        console.warn('Error removing from localStorage:', error);
      }
    }
  }

  getBlockTimeRemaining(): string {
    if (!this.blockUntil) return '';
    
    const now = new Date();
    const diff = this.blockUntil.getTime() - now.getTime();
    
    if (diff <= 0) {
      this.clearBlock();
      return '';
    }
    
    const minutes = Math.ceil(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  // Form submission
  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.hideError();

    if (this.isBlocked) {
      const timeRemaining = this.getBlockTimeRemaining();
      if (timeRemaining) {
        this.generalError = `Account is temporarily blocked. Try again in ${timeRemaining}.`;
        this.showError = true;
        return;
      }
    }
    
    if (!this.validateFormForSubmission()) {
      this.generalError = 'Please fix the errors below and try again';
      this.showError = true;
      return;
    }

    this.isLoading = true;

    try {
      const credentials: SignInRequest = {
        usernameOrEmail: this.usernameOrEmail.trim(),
        password: this.password
      };

      const subscription = this.authService.signIn(credentials).subscribe({
        next: (response) => {
          console.log('Sign in successful:', response);
          
          // Clear any blocking on successful login
          this.clearBlock();
          
          this.authService.setToken(response.token, response.tokenType);
          
          const tokenValidation = this.authService.validateToken().subscribe({
            next: () => {
              this.isLoading = false;
              this.resetForm();
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1500);
            },
            error: (error) => {
              console.error('Token validation error:', error);
              this.isLoading = false;
              this.handleSignInError({ status: 500, error: { message: 'Authentication error' } });
            }
          });
          
          this.subscriptions.push(tokenValidation);
        },
        error: (error) => {
          console.error('Sign in error:', error);
          this.handleSignInError(error);
        }
      });

      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('Unexpected error:', error);
      this.handleSignInError({ status: 0, error: { message: 'Unexpected error occurred' } });
    }
  }

  private handleSignInError(error: any): void {
    // Always reset loading state first
    this.isLoading = false;
    
    let errorMessage = 'An error occurred during sign in';
    
    if (error.status === 401) {
      errorMessage = 'Invalid username/email or password';
      this.addFailedAttempt();
      
      // Don't clear the form values, just mark fields as having errors
      this.formErrors['usernameOrEmail'] = 'Invalid credentials';
      this.formErrors['password'] = 'Invalid credentials';
      this.touchedFields['usernameOrEmail'] = true;
      this.touchedFields['password'] = true;
      
      // Clear password for security but keep username/email
      this.password = '';
    } else if (error.status === 400) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        // Handle the specific format from your server
        errorMessage = error.error.error;
      } else {
        errorMessage = 'Please check your input and try again';
      }
    } else if (error.status === 429) {
      errorMessage = 'Too many attempts. Please try again later.';
      this.addFailedAttempt();
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    this.generalError = errorMessage;
    this.showError = true;
  }

  private resetForm(): void {
    this.usernameOrEmail = '';
    this.password = '';
    this.rememberMe = false;
    this.formErrors = {};
    this.touchedFields = {};
    this.showError = false;
    this.generalError = '';
    this.showPassword = false;
  }
}