import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ResumeParseService } from '../../services/resume-parse.service';
import { ParsedResumeResponse } from '../../models/parsed-resume.model';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from "../../core/layout/header/header";


@Component({
  selector: 'app-parse-resume',
  imports: [CommonModule, FormsModule, ToastModule, HeaderComponent],
  providers: [MessageService],
  templateUrl: './parse-resume.html',
  styleUrl: './parse-resume.css'
})
export class ParseResume {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  error: string = '';
  isDragging = false;
  isFirstTime = true; // Check if this is first time setup

  constructor(
    private resumeParseService: ResumeParseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private toastService: ToastService
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
        this.toastService.showError(
          'Invalid File Type',
          'Please select a PDF file only. Other file formats are not supported.',
          4000
        );
        return;
      }
      this.selectedFile = file;
      this.error = '';
      this.toastService.showFileUploadSuccess(file.name);
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
        this.toastService.showError(
          'Invalid File Type',
          'Please select a PDF file only. Other file formats are not supported.',
          4000
        );
        return;
      }
      this.selectedFile = file;
      this.error = '';
      this.toastService.showFileUploadSuccess(file.name);
    }
  }

  parseResume(): void {
    if (!this.selectedFile) {
      this.error = 'Please select a PDF resume file.';
      this.toastService.showError(
        'No File Selected',
        'Please select a PDF resume file to continue.',
        4000
      );
      return;
    }

    this.ngZone.run(() => {
      this.isLoading = true;
      this.error = '';
      this.cdr.markForCheck();
    });

    // Show info toast that parsing has started
    this.toastService.showInfo(
      'Parsing Started',
      'Your resume is being processed. This may take a few moments...',
      3000
    );

    this.resumeParseService.parseResume(this.selectedFile).subscribe({
      next: (result: ParsedResumeResponse) => {
        console.log('Resume parsing successful:', result);
        
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
          
          // Show success toast
          this.toastService.showResumeParseSuccess(result.message);
          
          // Store result in session storage for dashboard notification
          sessionStorage.setItem('resumeAnalysisResult', JSON.stringify(result));
          
          // Redirect to dashboard after a short delay to show the toast
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
          this.toastService.showResumeParseError(errorMessage);
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
    this.toastService.showInfo(
      'Setup Skipped',
      'You can upload your resume later from the dashboard.',
      3000
    );
    this.router.navigate(['/dashboard']);
  }

  clearAll(): void {
    this.selectedFile = null;
    this.error = '';
    this.toastService.showInfo(
      'Form Cleared',
      'All fields have been reset.',
      2000
    );
  }
}