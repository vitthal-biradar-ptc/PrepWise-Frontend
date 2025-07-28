import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  error: string = '';
  isLoading: boolean = false;

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading = true;
    this.error = '';

    // Simulate API call delay
    console.log('Sign in attempt:', {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    });

    setTimeout(() => {
      this.isLoading = false;
      // In a real app, you would handle the API response here
      console.log('Successfully signed in');
      
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
    this.rememberMe = false;
    this.error = '';
  }
}
