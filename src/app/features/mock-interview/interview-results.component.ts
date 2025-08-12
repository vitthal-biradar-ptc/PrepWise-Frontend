import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InterviewCard, InterviewResult } from '../../models/interview.models';
import { InterviewResultsService } from './services/interview-results.service';

@Component({
  selector: 'app-interview-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="results-container">
      <div class="results-header">
        <h1>My Interviews</h1>
        <div class="results-nav">
          <button 
            *ngFor="let tab of tabs" 
            class="nav-tab" 
            [class.active]="activeTab === tab.key"
            (click)="setActiveTab(tab.key)"
          >
            {{ tab.label }} ({{ getTabCount(tab.key) }})
          </button>
        </div>
      </div>
      
      <div class="results-grid">
        <div 
          *ngFor="let card of filteredCards" 
          class="interview-card"
          [class]="'card-' + card.status"
        >
          <div class="card-header">
            <div class="card-icon" [class]="'icon-' + getCategoryClass(card.category)">
              {{ getCategoryIcon(card.category) }}
            </div>
            <div class="card-title">
              <h3>{{ card.title }}</h3>
              <span class="card-category">{{ card.category }}</span>
            </div>
            <button class="delete-btn" (click)="deleteInterview(card.id)" aria-label="Delete interview">
              🗑️
            </button>
          </div>
          
          <p class="card-description">
            Tips based on learnings from 1000+ companies to help you prepare for your upcoming interviews.
          </p>
          
          <div class="card-metrics">
            <div class="metric">
              <span class="metric-icon">👁️</span>
              <span class="metric-text">{{ card.level }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">⏰</span>
              <span class="metric-text">{{ card.time }}</span>
            </div>
            <div class="metric">
              <span class="metric-icon">❓</span>
              <span class="metric-text">{{ card.questions }} Q</span>
            </div>
          </div>
          
          <div class="card-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="card.progress"></div>
            </div>
            <span class="progress-text">
              {{ card.progress === 100 ? 'Completed' : card.progress + '% Completed' }}
            </span>
          </div>
          
          <div class="card-actions">
            <button 
              *ngIf="card.status === 'completed'" 
              class="btn-primary"
              (click)="viewReport(card.id)"
            >
              View Report
            </button>
            <button 
              *ngIf="card.status === 'completed'" 
              class="btn-secondary"
              (click)="retakeInterview(card.id)"
            >
              Retake
            </button>
            <button 
              *ngIf="card.status === 'in-progress'" 
              class="btn-primary"
              (click)="resumeInterview(card.id)"
            >
              Resume
            </button>
            <button 
              *ngIf="card.status === 'in-progress'" 
              class="btn-secondary"
              (click)="restartInterview(card.id)"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .results-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
      color: #ffffff;
      padding: 24px;
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    
    .results-header {
      margin-bottom: 32px;
    }
    
    .results-header h1 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 24px;
      color: #ffffff;
    }
    
    .results-nav {
      display: flex;
      gap: 16px;
      border-bottom: 1px solid #333;
      padding-bottom: 16px;
    }
    
    .nav-tab {
      background: none;
      border: none;
      color: #888;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }
    
    .nav-tab:hover {
      color: #B03EFF;
      background: rgba(176, 62, 255, 0.1);
    }
    
    .nav-tab.active {
      color: #B03EFF;
      background: rgba(176, 62, 255, 0.15);
      border-bottom: 2px solid #B03EFF;
    }
    
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }
    
    .interview-card {
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .interview-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
      border-color: rgba(176, 62, 255, 0.6);
    }
    
    .card-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 16px;
    }
    
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    
    .icon-software { background: rgba(255, 193, 7, 0.2); }
    .icon-design { background: rgba(156, 39, 176, 0.2); }
    .icon-legal { background: rgba(244, 67, 54, 0.2); }
    .icon-finance { background: rgba(33, 150, 243, 0.2); }
    
    .card-title {
      flex: 1;
    }
    
    .card-title h3 {
      font-size: 20px;
      font-weight: bold;
      margin: 0 0 4px 0;
      color: #ffffff;
    }
    
    .card-category {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .delete-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.2s ease;
    }
    
    .delete-btn:hover {
      color: #ff4444;
    }
    
    .card-description {
      color: #b0b0b0;
      line-height: 1.5;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .card-metrics {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .metric {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .metric-icon {
      font-size: 16px;
    }
    
    .metric-text {
      font-size: 14px;
      color: #ffffff;
      font-weight: 500;
    }
    
    .card-progress {
      margin-bottom: 20px;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #7F00FF, #C400FF);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .progress-text {
      font-size: 14px;
      color: #ffffff;
      font-weight: 500;
    }
    
    .card-actions {
      display: flex;
      gap: 12px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #7F00FF, #C400FF);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex: 1;
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
      padding: 12px 20px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex: 1;
    }
    
    .btn-secondary:hover {
      background: rgba(176, 62, 255, 0.1);
      transform: translateY(-2px);
    }
    
    .card-completed .progress-fill {
      background: linear-gradient(90deg, #4CAF50, #5dbd60);
    }
    
    .card-in-progress .progress-fill {
      background: linear-gradient(90deg, #FF9800, #FFB74D);
    }
    
    .card-not-started .progress-fill {
      background: linear-gradient(90deg, #9E9E9E, #BDBDBD);
    }
  `]
})
export class InterviewResultsComponent implements OnInit {
  activeTab = 'all';
  tabs = [
    { key: 'all', label: 'All Interviews' },
    { key: 'completed', label: 'Completed' },
    { key: 'in-progress', label: 'Not Completed' },
    { key: 'not-started', label: 'Not Started' }
  ];
  
  interviewCards: InterviewCard[] = [];
  
  constructor(
    private router: Router,
    private interviewResultsService: InterviewResultsService
  ) {}
  
  async ngOnInit(): Promise<void> {
    await this.loadInterviewCards();
  }
  
  private async loadInterviewCards(): Promise<void> {
    try {
      // Try to load real data first, fallback to mock data
      this.interviewCards = await this.interviewResultsService.getInterviewCards();
      
      // If no real data, use mock data for development
      if (this.interviewCards.length === 0) {
        this.interviewCards = await this.interviewResultsService.getMockInterviewCards();
      }
    } catch (error) {
      console.error('Error loading interview cards:', error);
      // Fallback to mock data
      this.interviewCards = await this.interviewResultsService.getMockInterviewCards();
    }
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  getTabCount(tab: string): number {
    if (tab === 'all') return this.interviewCards.length;
    return this.interviewCards.filter(card => card.status === tab).length;
  }
  
  get filteredCards(): InterviewCard[] {
    if (this.activeTab === 'all') return this.interviewCards;
    return this.interviewCards.filter(card => card.status === this.activeTab);
  }
  
  getCategoryClass(category: string): string {
    if (category.includes('SOFTWARE')) return 'software';
    if (category.includes('DESIGN')) return 'design';
    if (category.includes('LEGAL')) return 'legal';
    if (category.includes('FINANCE')) return 'finance';
    return 'software';
  }
  
  getCategoryIcon(category: string): string {
    if (category.includes('SOFTWARE')) return '💻';
    if (category.includes('DESIGN')) return '🎨';
    if (category.includes('LEGAL')) return '⚖️';
    if (category.includes('FINANCE')) return '📊';
    return '💼';
  }
  
  viewReport(id: string): void {
    // Navigate to detailed report view
    this.router.navigate(['/interview-report', id]);
  }
  
  retakeInterview(id: string): void {
    // Start new interview with same role
    this.router.navigate(['/mock-interview'], { queryParams: { retake: id } });
  }
  
  resumeInterview(id: string): void {
    // Resume existing interview
    this.router.navigate(['/mock-interview'], { queryParams: { resume: id } });
  }
  
  restartInterview(id: string): void {
    // Restart existing interview
    this.router.navigate(['/mock-interview'], { queryParams: { restart: id } });
  }
  
  async deleteInterview(id: string): Promise<void> {
    try {
      await this.interviewResultsService.deleteInterviewResult(id);
      // Remove from local array
      this.interviewCards = this.interviewCards.filter(card => card.id !== id);
    } catch (error) {
      console.error('Error deleting interview:', error);
    }
  }
}
