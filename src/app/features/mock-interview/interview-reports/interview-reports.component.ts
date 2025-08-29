import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../core/layout/header/header';
import { FooterComponent } from '../../../core/layout/footer/footer';
import {
  InterviewService,
  InterviewReport,
} from '../services/interview.service';

@Component({
  selector: 'app-interview-reports',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './interview-reports.component.html',
})
export class InterviewReportsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewService);

  public reports: InterviewReport[] = [];
  public isLoading = true;
  public error: string | null = null;
  public userId: string = '';

  // Add Math for template usage
  protected readonly Math = Math;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params['user_id'];
      this.loadReports();
    });
  }

  public loadReports(): void {
    this.isLoading = true;
    this.error = null;

    this.interviewService.getUserReports(this.userId).subscribe({
      next: (reports) => {
        this.reports = reports.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.error = 'Failed to load interview reports. Please try again.';
        this.isLoading = false;
      },
    });
  }

  protected viewReport(reportId: number): void {
    this.router.navigate([
      `/interview-reports/user/${this.userId}/report/${reportId}`,
    ]);
  }

  protected startNewInterview(): void {
    this.router.navigate(['/mock-interview']);
  }

  protected getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  }

  protected goBackToReports(): void {
    this.router.navigate([`/interview-reports/user/${this.userId}`]);
  }

  protected getAverageScore(): string {
    if (!this.reports || this.reports.length === 0) {
      return '0.0';
    }
    const validScores = this.reports
      .map((r) => r.overallScore)
      .filter((score) => score !== undefined && score !== null);

    if (validScores.length === 0) {
      return '0.0';
    }

    const average =
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return average.toFixed(1);
  }

  protected getBestScore(): number {
    if (!this.reports || this.reports.length === 0) {
      return 0;
    }
    const scores = this.reports
      .map((r) => r.overallScore)
      .filter((score) => score !== undefined && score !== null);
    return scores.length > 0 ? Math.max(...scores) : 0;
  }
}
