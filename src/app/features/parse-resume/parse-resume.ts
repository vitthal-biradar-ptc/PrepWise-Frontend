import { Component, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResumeParseService } from '../../services/resume-parse.service';
import { ParsedResumeResponse } from '../../models/parsed-resume.model';
import { HeaderComponent } from "../../core/layout/header/header";
import { FooterComponent } from "../../core/layout/footer/footer";


@Component({
  selector: 'app-parse-resume',
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './parse-resume.html',
  styleUrl: './parse-resume.css'
})
export class ParseResume {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  error: string = '';
  isDragging = false;
  isFirstTime = true; // Check if this is first time setup

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private resumeParseService: ResumeParseService,
    private router: Router
  ) {
    // Check if user came from signup (first time) or dashboard
    const navigation = this.router.getCurrentNavigation();
    this.isFirstTime = navigation?.extras?.state?.['firstTime'] !== false;
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

    this.ngZone.run(() => {
      this.isLoading = true;
      this.error = '';
    });

    this.resumeParseService.parseResume(this.selectedFile).subscribe({
      next: (result: ParsedResumeResponse) => {
        console.log('Resume parsing successful:', result);
        
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
          
          // Store result in session storage for dashboard notification
          sessionStorage.setItem('resumeAnalysisResult', JSON.stringify(result));
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        });
      },
      error: (error) => {
        console.error('Error parsing resume:', error);
        
        this.ngZone.run(() => {
          const errorMessage = error.error?.message || 'An error occurred while parsing the resume.';
          this.error = errorMessage;
          this.isLoading = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        });
      }
    });
  }

  proceedToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  skipForNow(): void {
    this.router.navigate(['/dashboard']);
  }

  clearAll(): void {
    this.selectedFile = null;
    this.error = '';
  }
}