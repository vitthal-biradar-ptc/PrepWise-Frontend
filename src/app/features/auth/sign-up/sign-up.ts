import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService, SignUpRequest } from '../../../services/authorization.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterModule, HttpClientModule, ToastModule],
  providers: [MessageService],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // When the form is submitted, this method is called:
  handleSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.error = '';

    // Validate required fields
    if (!this.name.trim()) {
      this.error = "Name is required";
      this.toastService.showError('Validation Error', this.error);
      this.isLoading = false;
      return;
    }

    if (!this.username.trim()) {
      this.error = "Username is required";
      this.toastService.showError('Validation Error', this.error);
      this.isLoading = false;
      return;
    }

    if (!this.email.trim()) {
      this.error = "Email is required";
      this.toastService.showError('Validation Error', this.error);
      this.isLoading = false;
      return;
    }

    if (!this.location.trim()) {
      this.error = "Location is required";
      this.toastService.showError('Validation Error', this.error);
      this.isLoading = false;
      return;
    }

    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match";
      this.toastService.showError('Validation Error', this.error);
      this.isLoading = false;
      return;
    }

    // Validate terms acceptance
    if (!this.termsAccepted) {
      this.error = "Please accept the Terms of Service and Privacy Policy";
      this.toastService.showError('Validation Error', this.error);
      this.isLoading = false;
      return;
    }

    // Prepare GitHub and LinkedIn URLs if usernames are provided
    let githubUrl = null;
    if (this.githubUsername && this.githubUsername.trim()) {
      githubUrl = `https://github.com/${this.githubUsername.trim()}`;
    }

    let linkedinUrl = null;
    if (this.linkedinUsername && this.linkedinUsername.trim()) {
      linkedinUrl = `https://www.linkedin.com/in/${this.linkedinUsername.trim()}`;
    }

    // This creates the request body
    const userData: SignUpRequest = {
      email: this.email,
      username: this.username,
      name: this.name,
      password: this.password,
      location: this.location,
      githubUrl,
      linkedinUrl,
      portfolioLink: this.portfolioUrl.trim() || null
    };

    // Log the data being sent
    console.log('Sending sign-up data:', userData);

    // This line sends the POST request to your backend
    this.authService.signUp(userData).subscribe({
      next: (response) => {
        console.log('Sign up successful:', response);
        
        this.authService.setToken(response.token, response.tokenType);
        
        this.authService.validateToken().subscribe(() => {
          this.isLoading = false;
          this.resetForm();
          this.toastService.showAuthSuccess('Account created successfully! Welcome to PrepWise.');
          // Redirect to parse-resume page for first-time setup
          setTimeout(() => {
            this.router.navigate(['/parse-resume'], { state: { firstTime: true } });
          }, 1500);
        });
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
        
        this.toastService.showAuthError(errorMessage);
      }
    });
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
  }
}