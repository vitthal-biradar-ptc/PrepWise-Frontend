import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InterviewResult } from '../../models/interview.models';
import { InterviewResultsService } from './services/interview-results.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-interview-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="report-container">
      <div class="report-header">
        <button class="back-btn" (click)="goBack()">← Back to Interviews</button>
        <h1>Interview Report</h1>
      </div>
      
      <div *ngIf="interviewResult" class="report-content">
        <div class="report-summary">
          <div class="summary-card">
            <h2>{{ interviewResult.role }}</h2>
            <div class="summary-details">
              <div class="detail-item">
                <span class="label">Level:</span>
                <span class="value level-{{ interviewResult.level.toLowerCase() }}">{{ interviewResult.level }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Duration:</span>
                <span class="value">{{ interviewResult.duration }} minutes</span>
              </div>
              <div class="detail-item">
                <span class="label">Date:</span>
                <span class="value">{{ interviewResult.startTime | date:'medium' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Overall Score:</span>
                <span class="value score">{{ interviewResult.overallScore }}/10</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="report-sections">
          <div class="section">
            <h3>Performance Summary</h3>
            <div class="feedback-content">
              <div *ngIf="interviewResult.feedback.strengths.length > 0" class="feedback-group">
                <h4>Strengths</h4>
                <ul>
                  <li *ngFor="let strength of interviewResult.feedback.strengths; trackBy: trackByIndex">{{ strength }}</li>
                </ul>
              </div>
              
              <div *ngIf="interviewResult.feedback.improvementAreas.length > 0" class="feedback-group">
                <h4>Areas for Improvement</h4>
                <ul>
                  <li *ngFor="let area of interviewResult.feedback.improvementAreas; trackBy: trackByIndex">{{ area }}</li>
                </ul>
              </div>
              
              <div class="feedback-group">
                <h4>Detailed Feedback</h4>
                <p>{{ interviewResult.feedback.detailedFeedback }}</p>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3>Question & Answer Analysis</h3>
            <div class="qa-list">
              <div *ngFor="let qa of interviewResult.questions; let i = index; trackBy: trackByQuestion" class="qa-item">
                <div class="question">
                  <span class="question-number">Q{{ i + 1 }}</span>
                  <p>{{ qa.question }}</p>
                </div>
                <div class="answer">
                  <span class="answer-label">Your Answer:</span>
                  <p>{{ qa.userAnswer }}</p>
                </div>
                <div *ngIf="qa.feedback" class="feedback">
                  <span class="feedback-label">Feedback:</span>
                  <p>{{ qa.feedback }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="report-actions">
          <button class="btn-primary" (click)="retakeInterview()">Retake Interview</button>
          <button class="btn-secondary" (click)="downloadReport()">Download Report</button>
        </div>
      </div>
      
      <div *ngIf="!interviewResult && !loading" class="error-message">
        <p>Interview report not found.</p>
        <button class="btn-primary" (click)="goBack()">Go Back</button>
      </div>
      
      <div *ngIf="loading" class="loading">
        <p>Loading interview report...</p>
      </div>
    </div>
  `,
  styles: [`
    .report-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
      color: #ffffff;
      padding: 24px;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    
    .report-header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .back-btn {
      background: none;
      border: 1px solid rgba(176, 62, 255, 0.6);
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .back-btn:hover {
      background: rgba(176, 62, 255, 0.1);
    }
    
    .report-header h1 {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
      color: #ffffff;
    }
    
    .report-summary {
      margin-bottom: 32px;
    }
    
    .summary-card {
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 24px;
      max-width: 600px;
    }
    
    .summary-card h2 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 20px 0;
      color: #ffffff;
    }
    
    .summary-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .label {
      font-size: 14px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .value {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    }
    
    .level-easy { color: #B03EFF; }
    .level-medium { color: #C400FF; }
    .level-hard { color: #7F00FF; }
    
    .score {
      font-size: 20px;
      color: #ffffff;
      font-weight: bold;
    }
    
    .report-sections {
      display: grid;
      gap: 32px;
      margin-bottom: 32px;
    }
    
    .section {
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 24px;
    }
    
    .section h3 {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 20px 0;
      color: #ffffff;
      border-bottom: 1px solid #333;
      padding-bottom: 12px;
    }
    
    .feedback-content {
      display: grid;
      gap: 24px;
    }
    
    .feedback-group h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: #ffffff;
    }
    
    .feedback-group ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .feedback-group li {
      margin-bottom: 8px;
      color: #b0b0b0;
      line-height: 1.5;
    }
    
    .feedback-group p {
      margin: 0;
      color: #b0b0b0;
      line-height: 1.6;
    }
    
    .qa-list {
      display: grid;
      gap: 24px;
    }
    
    .qa-item {
      background: rgba(45, 45, 45, 0.5);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 20px;
    }
    
    .question {
      margin-bottom: 16px;
    }
    
    .question-number {
      display: inline-block;
      background: #4CAF50;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .question p {
      margin: 0;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.5;
    }
    
    .answer {
      margin-bottom: 16px;
    }
    
    .answer-label {
      display: block;
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .answer p {
      margin: 0;
      color: #b0b0b0;
      line-height: 1.5;
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border-radius: 8px;
    }
    
    .feedback {
      margin-top: 16px;
    }
    
    .feedback-label {
      display: block;
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .feedback p {
      margin: 0;
      color: #ffffff;
      line-height: 1.5;
      background: rgba(176, 62, 255, 0.1);
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid #B03EFF;
    }
    
    .report-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #7F00FF, #C400FF);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 16px 32px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(127, 0, 255, 0.35);
    }
    
    .btn-secondary {
      background: transparent;
      color: #ffffff;
      border: 1px solid rgba(176, 62, 255, 0.6);
      border-radius: 8px;
      padding: 16px 32px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;
    }
    
    .btn-secondary:hover {
      background: rgba(176, 62, 255, 0.1);
      transform: translateY(-2px);
    }
    
    .error-message {
      text-align: center;
      padding: 48px;
    }
    
    .error-message p {
      font-size: 18px;
      color: #888;
      margin-bottom: 24px;
    }
    
    .loading {
      text-align: center;
      padding: 48px;
    }
    
    .loading p {
      font-size: 18px;
      color: #888;
    }
    
    @media (max-width: 768px) {
      .report-container {
        padding: 16px;
      }
      
      .report-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      
      .summary-details {
        grid-template-columns: 1fr;
      }
      
      .report-actions {
        flex-direction: column;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewReportComponent implements OnInit, OnDestroy {
  interviewResult: InterviewResult | null = null;
  loading = true;
  private destroyed$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interviewResultsService: InterviewResultsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async params => {
        const id = params.get('id');
        this.loading = true;
        if (id) {
          await this.loadInterviewReport(id);
        }
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private async loadInterviewReport(id: string): Promise<void> {
    try {
      this.interviewResult = await this.interviewResultsService.getInterviewResult(id);
      if (!this.interviewResult) {
        console.error('Interview report not found:', id);
      }
    } catch (error) {
      console.error('Error loading interview report:', error);
    }
  }

  goBack(): void {
    this.router.navigate(['/interview-results']);
  }

  retakeInterview(): void {
    if (this.interviewResult) {
      this.router.navigate(['/mock-interview'], { 
        queryParams: { retake: this.interviewResult.id } 
      });
    }
  }

  downloadReport(): void {
    // Placeholder for future PDF export/print integration
    console.info('Report download feature coming soon.');
  }

  // TrackBy helpers for template
  trackByIndex(i: number): number { return i; }
  trackByQuestion(i: number, qa: { question: string }): string { return qa?.question || String(i); }
}
