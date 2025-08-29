import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { ResumeAnalyzer } from './resume-analyzer';
import { ResumeAnalyzerService } from './services/resume-analyzer.service';
import { ResumeAnalysisResponse } from '../../models/resume-analysis.model';

// Mock Header Component
@Component({
  selector: 'app-header',
  template: '<div>Mock Header</div>',
  standalone: true,
})
class MockHeaderComponent {}

// Mock Footer Component
@Component({
  selector: 'app-footer',
  template: '<div>Mock Footer</div>',
  standalone: true,
})
class MockFooterComponent {}

describe('ResumeAnalyzer', () => {
  let component: ResumeAnalyzer;
  let fixture: ComponentFixture<ResumeAnalyzer>;
  let resumeAnalyzerServiceSpy: jasmine.SpyObj<ResumeAnalyzerService>;

  const mockAnalysisResponse: ResumeAnalysisResponse = {
    domain: 'Software Engineering',
    suggestions: [
      'Add more technical skills to your resume',
      'Include quantifiable achievements in your experience section',
      'Improve the summary section with keywords',
    ],
  };

  beforeEach(async () => {
    const resumeServiceSpy = jasmine.createSpyObj('ResumeAnalyzerService', [
      'analyzeResumeFile',
      'analyzeResumeText',
      'analyzeResume',
    ]);

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [CommonModule, FormsModule, RouterTestingModule, ResumeAnalyzer],
      providers: [
        { provide: ResumeAnalyzerService, useValue: resumeServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ResumeAnalyzer, {
        set: {
          imports: [
            CommonModule,
            FormsModule,
            MockHeaderComponent,
            MockFooterComponent,
          ],
          template: `
          <div class="test-container">
            <app-header></app-header>
            <div class="content">
              <!-- Tab Buttons -->
              <div class="tabs">
                <button 
                  class="tab-btn"
                  [class.active]="activeTab === 'file'" 
                  (click)="switchTab('file')"
                  data-testid="file-tab">
                  Upload File
                </button>
                <button 
                  class="tab-btn"
                  [class.active]="activeTab === 'text'" 
                  (click)="switchTab('text')"
                  data-testid="text-tab">
                  Paste Text
                </button>
              </div>
              
              <!-- File Upload Tab -->
              <div *ngIf="activeTab === 'file'" data-testid="file-tab-content">
                <div class="drop-zone"
                     [class.dragging]="isDragging"
                     [class.has-file]="selectedFile"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)">
                  <div *ngIf="!selectedFile">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      (change)="onFileSelected($event)"
                      data-testid="file-input" />
                  </div>
                  <div *ngIf="selectedFile" class="selected-file" data-testid="selected-file">
                    <span>{{ selectedFile.name }}</span>
                    <button (click)="selectedFile = null" data-testid="remove-file">Remove</button>
                  </div>
                </div>
              </div>
              
              <!-- Text Input Tab -->
              <div *ngIf="activeTab === 'text'" data-testid="text-tab-content">
                <textarea 
                  [(ngModel)]="resumeText" 
                  placeholder="Paste your resume text here..."
                  data-testid="text-input">
                </textarea>
              </div>
              
              <!-- Error Display -->
              <div *ngIf="error" class="error" data-testid="error-message">{{ error }}</div>
              
              <!-- Action Buttons -->
              <div class="actions">
                <button 
                  class="analyze-btn" 
                  (click)="analyzeResume()"
                  [disabled]="isLoading || (!selectedFile && !resumeText.trim())"
                  data-testid="analyze-btn">
                  <span *ngIf="!isLoading">Analyze Resume</span>
                  <span *ngIf="isLoading">Analyzing...</span>
                </button>
                <button 
                  class="clear-btn" 
                  (click)="clearAll()"
                  data-testid="clear-btn">
                  Clear All
                </button>
              </div>
              
              <!-- Results Section -->
              <div class="results">
                <!-- No Results State -->
                <div *ngIf="!analysisResult && !isLoading" class="no-results" data-testid="no-results">
                  <h3>Ready for Analysis</h3>
                  <p>Upload your resume or paste the text to get started.</p>
                </div>
                
                <!-- Loading State -->
                <div *ngIf="isLoading" class="loading" data-testid="loading-state">
                  <h3>AI Analysis in Progress</h3>
                  <p>Time elapsed: {{ getElapsedTime() }}s</p>
                </div>
                
                <!-- Analysis Results -->
                <div *ngIf="analysisResult && !isLoading" class="analysis-results" data-testid="analysis-results">
                  <h2>Analysis Complete</h2>
                  <div *ngIf="analysisResult.domain" data-testid="domain">Domain: {{ analysisResult.domain }}</div>
                  <div *ngIf="analysisResult.suggestions && analysisResult.suggestions.length > 0">
                    <h3>Recommendations</h3>
                    <div *ngFor="let suggestion of analysisResult.suggestions; let i = index; trackBy: trackBySuggestion" 
                         class="suggestion-item" data-testid="suggestion-item">
                      <span class="suggestion-number">{{ i + 1 }}</span>
                      <span>{{ suggestion }}</span>
                    </div>
                  </div>
                  <div *ngIf="!analysisResult.suggestions || analysisResult.suggestions.length === 0" 
                       data-testid="no-suggestions">
                    <h3>Great Resume!</h3>
                    <p>Your resume looks excellent.</p>
                  </div>
                </div>
              </div>
            </div>
            <app-footer></app-footer>
          </div>
        `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResumeAnalyzer);
    component = fixture.componentInstance;
    resumeAnalyzerServiceSpy = TestBed.inject(
      ResumeAnalyzerService
    ) as jasmine.SpyObj<ResumeAnalyzerService>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.selectedFile).toBeNull();
      expect(component.resumeText).toBe('');
      expect(component.analysisResult).toBeNull();
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBe('');
      expect(component.activeTab).toBe('file');
      expect(component.isDragging).toBeFalse();
    });

    it('should call ngOnInit without errors', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });
  });

  describe('File Selection', () => {
    it('should select valid PDF file', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBe(mockFile);
      expect(component.error).toBe('');
    });

    it('should reject non-PDF files', () => {
      const mockFile = new File(['test content'], 'test-resume.doc', {
        type: 'application/msword',
      });
      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBeNull();
      expect(component.error).toBe('Please select a PDF file only.');
    });

    it('should handle no file selected', () => {
      const mockEvent = {
        target: {
          files: [],
        },
      };

      component.onFileSelected(mockEvent);

      expect(component.selectedFile).toBeNull();
    });
  });

  describe('Drag and Drop Functionality', () => {
    let mockDragEvent: DragEvent;

    beforeEach(() => {
      mockDragEvent = new DragEvent('dragover');
      spyOn(mockDragEvent, 'preventDefault');
      spyOn(mockDragEvent, 'stopPropagation');
    });

    it('should handle drag over event', () => {
      component.onDragOver(mockDragEvent);

      expect(mockDragEvent.preventDefault).toHaveBeenCalled();
      expect(mockDragEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBeTrue();
    });

    it('should handle drag leave event', () => {
      component.isDragging = true;
      component.onDragLeave(mockDragEvent);

      expect(mockDragEvent.preventDefault).toHaveBeenCalled();
      expect(mockDragEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBeFalse();
    });

    it('should handle valid file drop', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      const mockDropEvent = new DragEvent('drop');
      Object.defineProperty(mockDropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
        },
      });
      spyOn(mockDropEvent, 'preventDefault');
      spyOn(mockDropEvent, 'stopPropagation');

      component.onDrop(mockDropEvent);

      expect(mockDropEvent.preventDefault).toHaveBeenCalled();
      expect(mockDropEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBeFalse();
      expect(component.selectedFile).toBe(mockFile);
      expect(component.error).toBe('');
    });

    it('should reject invalid file drop', () => {
      const mockFile = new File(['test content'], 'test-resume.doc', {
        type: 'application/msword',
      });
      const mockDropEvent = new DragEvent('drop');
      Object.defineProperty(mockDropEvent, 'dataTransfer', {
        value: {
          files: [mockFile],
        },
      });
      spyOn(mockDropEvent, 'preventDefault');
      spyOn(mockDropEvent, 'stopPropagation');

      component.onDrop(mockDropEvent);

      expect(component.selectedFile).toBeNull();
      expect(component.error).toBe('Please select a PDF file only.');
    });
  });

  describe('Resume Analysis', () => {
    it('should analyze resume with file', fakeAsync(() => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        of(mockAnalysisResponse)
      );

      component.analyzeResume();

      // Force change detection to ensure state updates are applied
      fixture.detectChanges();
      tick();

      // After ngZone.run and observable completion
      expect(component.isLoading).toBeFalse();
      expect(component.analysisResult).toEqual(mockAnalysisResponse);
      expect(component.error).toBe('');
      expect(resumeAnalyzerServiceSpy.analyzeResumeFile).toHaveBeenCalledWith(
        mockFile
      );
    }));

    it('should analyze resume with text', fakeAsync(() => {
      const testText = 'Software Engineer with 5 years experience...';
      component.resumeText = testText;
      resumeAnalyzerServiceSpy.analyzeResumeText.and.returnValue(
        of(mockAnalysisResponse)
      );

      component.analyzeResume();

      // Force change detection to ensure state updates are applied
      fixture.detectChanges();
      tick();

      // After ngZone.run and observable completion
      expect(component.isLoading).toBeFalse();
      expect(component.analysisResult).toEqual(mockAnalysisResponse);
      expect(component.error).toBe('');
      expect(resumeAnalyzerServiceSpy.analyzeResumeText).toHaveBeenCalledWith(
        testText
      );
    }));

    it('should show error when no file or text provided', () => {
      component.selectedFile = null;
      component.resumeText = '';

      component.analyzeResume();

      expect(component.error).toBe(
        'Please upload a file or paste resume text.'
      );
      expect(component.isLoading).toBeFalse();
    });

    it('should handle analysis error', fakeAsync(() => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;
      const errorResponse = { error: { message: 'Analysis failed' } };
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        throwError(() => errorResponse)
      );

      component.analyzeResume();

      // Force change detection and tick for async operations
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.error).toBe('Analysis failed');
      expect(component.analysisResult).toBeNull();
    }));

    it('should handle analysis error without specific message', fakeAsync(() => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.analyzeResume();

      // Force change detection and tick for async operations
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.error).toBe(
        'Failed to analyze resume. Please try again.'
      );
    }));

    it('should set loading state during analysis', fakeAsync(() => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;

      // Use a delayed observable that we can control with proper typing
      let resolveObservable: (value: ResumeAnalysisResponse) => void;
      const delayedObservable = new Observable<ResumeAnalysisResponse>(
        (subscriber) => {
          resolveObservable = (value: ResumeAnalysisResponse) => {
            subscriber.next(value);
            subscriber.complete();
          };
        }
      );

      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        delayedObservable
      );

      // Start the analysis
      component.analyzeResume();

      // Force immediate change detection
      fixture.detectChanges();

      // Check that loading state is set
      expect(component.isLoading).toBeTrue();
      expect(component.error).toBe('');
      expect(component.analysisResult).toBeNull();

      // Complete the observable
      resolveObservable!(mockAnalysisResponse);
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.analysisResult).toEqual(mockAnalysisResponse);
    }));
  });

  describe('Tab Switching', () => {
    it('should switch to text tab', () => {
      component.switchTab('text');

      expect(component.activeTab).toBe('text');
      expect(component.error).toBe('');
    });

    it('should switch to file tab', () => {
      component.activeTab = 'text';
      component.switchTab('file');

      expect(component.activeTab).toBe('file');
      expect(component.error).toBe('');
    });
  });

  describe('Clear All Functionality', () => {
    it('should clear all data', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;
      component.resumeText = 'Test text';
      component.analysisResult = mockAnalysisResponse;
      component.error = 'Test error';

      component.clearAll();

      expect(component.selectedFile).toBeNull();
      expect(component.resumeText).toBe('');
      expect(component.analysisResult).toBeNull();
      expect(component.error).toBe('');
    });
  });

  describe('Utility Methods', () => {
    it('should get current time', () => {
      const currentTime = component.getCurrentTime();
      expect(currentTime).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should calculate elapsed time when timer is running', () => {
      component['analysisStartTime'] = Date.now() - 5000; // 5 seconds ago
      const elapsed = component.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(4);
      expect(elapsed).toBeLessThanOrEqual(6);
    });

    it('should return 0 when timer is not started', () => {
      component['analysisStartTime'] = 0;
      const elapsed = component.getElapsedTime();
      expect(elapsed).toBe(0);
    });

    it('should track suggestions by index', () => {
      const index = 2;
      const suggestion = 'Test suggestion';
      const result = component.trackBySuggestion(index, suggestion);
      expect(result).toBe(index);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete file analysis workflow', fakeAsync(() => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      const mockEvent = { target: { files: [mockFile] } };
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        of(mockAnalysisResponse)
      );

      // Select file
      component.onFileSelected(mockEvent);
      expect(component.selectedFile).toBe(mockFile);

      // Analyze
      component.analyzeResume();

      // Force change detection and complete async operations
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.analysisResult).toEqual(mockAnalysisResponse);
      expect(component.error).toBe('');
    }));

    it('should handle complete text analysis workflow', fakeAsync(() => {
      const testText = 'Software Engineer with experience...';
      resumeAnalyzerServiceSpy.analyzeResumeText.and.returnValue(
        of(mockAnalysisResponse)
      );

      // Switch to text tab
      component.switchTab('text');
      expect(component.activeTab).toBe('text');

      // Enter text
      component.resumeText = testText;

      // Analyze
      component.analyzeResume();

      // Force change detection and complete async operations
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.analysisResult).toEqual(mockAnalysisResponse);
      expect(component.error).toBe('');
    }));

    it('should handle error and recovery workflow', fakeAsync(() => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;

      // First analysis fails
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.analyzeResume();

      // Force change detection and complete async operations
      fixture.detectChanges();
      tick();

      expect(component.error).toBe(
        'Failed to analyze resume. Please try again.'
      );
      expect(component.isLoading).toBeFalse();

      // Clear and try again
      component.clearAll();
      expect(component.error).toBe('');

      // Second analysis succeeds
      component.selectedFile = mockFile;
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        of(mockAnalysisResponse)
      );
      component.analyzeResume();

      // Force change detection and complete async operations
      fixture.detectChanges();
      tick();

      expect(component.analysisResult).toEqual(mockAnalysisResponse);
      expect(component.error).toBe('');
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only text input', () => {
      component.resumeText = '   \n\t   ';
      component.analyzeResume();

      expect(component.error).toBe(
        'Please upload a file or paste resume text.'
      );
    });

    it('should handle empty analysis response', fakeAsync(() => {
      const emptyResponse: ResumeAnalysisResponse = {
        domain: '',
        suggestions: [],
      };
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        of(emptyResponse)
      );

      component.analyzeResume();
      tick();

      expect(component.analysisResult).toEqual(emptyResponse);
      expect(component.error).toBe('');
    }));

    it('should handle analysis response with only domain', fakeAsync(() => {
      const partialResponse: ResumeAnalysisResponse = {
        domain: 'Software Engineering',
        suggestions: [],
      };
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      component.selectedFile = mockFile;
      resumeAnalyzerServiceSpy.analyzeResumeFile.and.returnValue(
        of(partialResponse)
      );

      component.analyzeResume();
      tick();

      expect(component.analysisResult).toEqual(partialResponse);
      expect(component.error).toBe('');
    }));
  });
});
