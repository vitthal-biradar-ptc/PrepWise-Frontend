import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResumeParseService } from './services/resume-parse.service';
import { ParsedResumeResponse } from '../../models/parsed-resume.model';
import { UserProfileService } from '../../services/user-profile.service';
import { HeaderComponent } from '../../core/layout/header/header';
import { FooterComponent } from '../../core/layout/footer/footer';

@Component({
  selector: 'app-parse-resume',
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './parse-resume.html',
  styleUrl: './parse-resume.css',
})
export class ParseResume {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  error: string = '';
  isDragging = false;
  isFirstTime = true;
  private userId: string | null = null;

  constructor(
    private resumeParseService: ResumeParseService,
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    // Check if user came from signup (first time) or dashboard
    const navigation = this.router.getCurrentNavigation();
    this.isFirstTime = navigation?.extras?.state?.['firstTime'] !== false;

    // Get user ID on component initialization
    this.initializeUserId();
  }

  private async initializeUserId(): Promise<void> {
    try {
      const result = await this.userProfileService.getUserIdCached().toPromise();
      this.userId = result ?? null;
      if (!this.userId) {
        console.error('User ID not found');
        this.error =
          'Unable to get user information. Please try logging in again.';
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
      this.error =
        'Unable to get user information. Please try logging in again.';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.error = 'Please select a PDF file only.';
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        this.error = 'Please select a PDF file only.';
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  parseResume(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a PDF resume file.';
      return;
    }

    if (!this.userId) {
      this.error =
        'Unable to get user information. Please try refreshing the page.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.resumeParseService.parseResume(this.selectedFile).subscribe({
      next: (result: ParsedResumeResponse) => {
        this.isLoading = false;

        // Store result in session storage for dashboard notification
        sessionStorage.setItem('resumeAnalysisResult', JSON.stringify(result));

        // Navigate to user-specific dashboard after a short delay
        setTimeout(() => {
          this.router.navigate([`/dashboard/user/${this.userId}`]);
        }, 1500);
      },
      error: (error) => {
        console.error('Error parsing resume:', error);

        const errorMessage =
          error.error?.message || 'An error occurred while parsing the resume.';
        this.error = errorMessage;
        this.isLoading = false;
      },
    });
  }

  proceedToDashboard(): void {
    if (this.userId) {
      this.router.navigate([`/dashboard/user/${this.userId}`]);
    } else {
      // Fallback to general dashboard if user ID is not available
      this.router.navigate(['/']);
    }
  }

  skipForNow(): void {
    if (this.userId) {
      this.router.navigate([`/dashboard/user/${this.userId}`]);
    } else {
      // Fallback to general dashboard if user ID is not available
      this.router.navigate(['/']);
    }
  }

  clearAll(): void {
    this.selectedFile = null;
    this.error = '';
  }
}
