import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ResumeAnalyzerService } from '../../services/resume-analyzer.service';
import { ResumeAnalysisResponse } from '../../models/resume-analysis.model';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from "../../core/layout/header/header";

@Component({
  selector: 'app-resume-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, HeaderComponent],
  providers: [MessageService],
  templateUrl: './resume-analyzer.html',
  styleUrls: ['./resume-analyzer.css']
})
export class ResumeAnalyzer implements OnInit {
  selectedFile: File | null = null;
  resumeText: string = '';
  analysisResult: ResumeAnalysisResponse | null = null;
  isLoading: boolean = false;
  error: string = '';
  activeTab: 'file' | 'text' = 'file';
  private analysisStartTime: number = 0;

  // Add this property to track drag state
  isDragging = false;

  constructor(
    private resumeAnalyzerService: ResumeAnalyzerService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Test toast functionality
    this.testToast();
  }

  // Test method to verify toasts are working
  testToast(): void {
    setTimeout(() => {
      this.toastService.showSuccess('Welcome!', 'Resume Analyzer is ready to use.');
    }, 1000);
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

  analyzeResume(): void {
    if (!this.selectedFile && !this.resumeText.trim()) {
      this.error = 'Please upload a file or paste resume text.';
      this.toastService.showError(
        'No Input Provided',
        'Please upload a PDF file or paste your resume text to continue.',
        4000
      );
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.analysisResult = null;
    this.startTimer();

    // Show info toast that analysis has started
    this.toastService.showInfo(
      'Analysis Started',
      'Your resume is being analyzed with AI. This may take a few moments...',
      3000
    );

    // Use the correct service methods based on input type
    const analysisObservable = this.selectedFile 
      ? this.resumeAnalyzerService.analyzeResumeFile(this.selectedFile)
      : this.resumeAnalyzerService.analyzeResumeText(this.resumeText);

    analysisObservable.subscribe({
      next: (result: ResumeAnalysisResponse) => {
        this.isLoading = false;
        this.analysisResult = result;
        this.stopTimer();
        this.toastService.showResumeAnalysisSuccess(result.suggestions?.length);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.stopTimer();
        const errorMessage = error.error?.message || 'Failed to analyze resume. Please try again.';
        this.error = errorMessage;
        this.toastService.showResumeAnalysisError(errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  clearAll(): void {
    this.selectedFile = null;
    this.resumeText = '';
    this.analysisResult = null;
    this.error = '';
    this.toastService.showInfo(
      'Form Cleared',
      'All fields and results have been reset.',
      2000
    );
  }

  switchTab(tab: 'file' | 'text'): void {
    this.activeTab = tab;
    this.error = '';
    this.toastService.showInfo(
      'Tab Switched',
      `Switched to ${tab === 'file' ? 'file upload' : 'text input'} mode.`,
      2000
    );
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }

  getElapsedTime(): number {
    if (this.analysisStartTime === 0) return 0;
    return Math.floor((Date.now() - this.analysisStartTime) / 1000);
  }

  trackBySuggestion(index: number, item: string): number {
    return index;
  }

  private startTimer(): void {
    this.analysisStartTime = Date.now();
    console.log('Analysis started at:', new Date().toISOString());
  }

  private stopTimer(): void {
    const endTime = Date.now();
    const duration = endTime - this.analysisStartTime;
    console.log('Analysis completed at:', new Date().toISOString());
    console.log('Total analysis time:', duration, 'ms');
  }
}

// Add this export for the router
export { ResumeAnalyzer as ResumeAnalyzerComponent };

