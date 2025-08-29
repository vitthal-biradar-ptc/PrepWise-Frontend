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
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './report.component.html',
})
export class ReportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewService);

  public report: InterviewReport | null = null;
  public isLoading = true;
  public error: string | null = null;
  public userId: string = '';
  public reportId: string = '';

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params['user_id'];
      this.reportId = params['report_id'];
      this.loadReport();
    });
  }

  public loadReport(): void {
    this.isLoading = true;
    this.error = null;

    this.interviewService.getReportById(this.userId, this.reportId).subscribe({
      next: (report) => {
        this.report = report;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading report:', error);
        this.error = 'Failed to load interview report. Please try again.';
        this.isLoading = false;
      },
    });
  }

  protected getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  }

  protected goBackToReports(): void {
    this.router.navigate([`/interview-reports/user/${this.userId}`]);
  }

  protected startNewInterview(): void {
    this.router.navigate(['/mock-interview']);
  }
}
