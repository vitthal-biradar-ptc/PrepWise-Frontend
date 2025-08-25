import { Component, ChangeDetectorRef, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumeAnalyzerService } from '../../services/resume-analyzer.service';
import { ResumeAnalysisResponse } from '../../models/resume-analysis.model';
import { Router } from '@angular/router';
import { HeaderComponent } from "../../core/layout/header/header";
import { FooterComponent } from "../../core/layout/footer/footer";

@Component({
  selector: 'app-resume-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
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

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private resumeAnalyzerService: ResumeAnalyzerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Ensure proper initialization with zone
    this.ngZone.run(() => {
      // Component initialized - ready for use
    });
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

  analyzeResume(): void {
    if (!this.selectedFile && !this.resumeText.trim()) {
      this.error = 'Please upload a file or paste resume text.';
      return;
    }

    this.ngZone.run(() => {
      this.isLoading = true;
      this.error = '';
      this.analysisResult = null;
      this.startTimer();
    });

    // Use the correct service methods based on input type
    const analysisObservable = this.selectedFile 
      ? this.resumeAnalyzerService.analyzeResumeFile(this.selectedFile)
      : this.resumeAnalyzerService.analyzeResumeText(this.resumeText);

    analysisObservable.subscribe({
      next: (result: ResumeAnalysisResponse) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.analysisResult = result;
          this.stopTimer();
          this.cdr.detectChanges();
        });
      },
      error: (error: any) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.stopTimer();
          const errorMessage = error.error?.message || 'Failed to analyze resume. Please try again.';
          this.error = errorMessage;
          this.cdr.detectChanges();
        });
      }
    });
  }

  clearAll(): void {
    this.selectedFile = null;
    this.resumeText = '';
    this.analysisResult = null;
    this.error = '';
    this.cdr.detectChanges();
  }

  switchTab(tab: 'file' | 'text'): void {
    this.activeTab = tab;
    this.error = '';
    this.cdr.detectChanges();
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
  }

  private stopTimer(): void {
    const endTime = Date.now();
    const duration = endTime - this.analysisStartTime;
  }
}
