import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  termsAccepted: boolean = false;
  error: string = '';
  isLoading: boolean = false;

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.error = '';

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

    // Here you would typically make an API call
    // For now, we'll simulate a successful signup
    console.log('Sign up attempt:', {
      email: this.email,
      password: this.password
    });

    // Simulate API call delay
    setTimeout(() => {
      this.isLoading = false;
      // In a real app, you would handle the API response here
      // For now, we'll just show a success message
      console.log('Account created successfully');
      
      // Reset form
      this.resetForm();
    }, 2000);
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
    this.password = '';
    this.confirmPassword = '';
    this.termsAccepted = false;
    this.error = '';
  }
}
