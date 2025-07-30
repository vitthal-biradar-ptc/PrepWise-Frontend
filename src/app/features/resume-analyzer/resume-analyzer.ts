import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumeAnalyzerService } from '../../services/resume-analyzer.service';
import { ResumeAnalysisResponse } from '../../models/resume-analysis.model';

@Component({
  selector: 'app-resume-analyzer',
  imports: [CommonModule, FormsModule],
  templateUrl: './resume-analyzer.html',
  styleUrl: './resume-analyzer.css'
})
export class ResumeAnalyzer {
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
    private ngZone: NgZone
  ) {}

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
      this.error = 'Please select a file or enter resume text.';
      return;
    }

    this.analysisStartTime = Date.now();
    console.log('Analysis started at:', new Date().toISOString());

    // Set loading state and force immediate UI update
    this.ngZone.run(() => {
      this.isLoading = true;
      this.error = '';
      this.analysisResult = null;
      this.cdr.markForCheck();
    });

    const analysisObservable = this.activeTab === 'file' && this.selectedFile
      ? this.resumeAnalyzerService.analyzeResumeFile(this.selectedFile)
      : this.resumeAnalyzerService.analyzeResumeText(this.resumeText);

    analysisObservable.subscribe({
      next: (result: ResumeAnalysisResponse) => {
        const endTime = Date.now();
        const duration = endTime - this.analysisStartTime;
        
        console.log('Analysis completed at:', new Date().toISOString());
        console.log('Total analysis time:', duration, 'ms');
        console.log('Resume Analysis Result:', result);
        
        // Use NgZone to ensure immediate UI update
        this.ngZone.run(() => {
          console.log('Setting results in NgZone...');
          this.analysisResult = result;
          this.isLoading = false;
          
          // Multiple strategies to force update
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          
          console.log('UI should be updated now - Results set:', !!this.analysisResult);
          console.log('Loading state:', this.isLoading);
        });
      },
      error: (error) => {
        const endTime = Date.now();
        const duration = endTime - this.analysisStartTime;
        
        console.error('Analysis failed at:', new Date().toISOString());
        console.error('Total time before error:', duration, 'ms');
        console.error('Error analyzing resume:', error);
        
        this.ngZone.run(() => {
          this.error = error.error?.suggestions?.[0] || error.message || 'An error occurred while analyzing the resume.';
          this.isLoading = false;
          this.cdr.markForCheck();
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
  }

  switchTab(tab: 'file' | 'text'): void {
    this.activeTab = tab;
    this.error = '';
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
}
