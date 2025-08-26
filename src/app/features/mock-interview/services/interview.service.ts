import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/authorization.service';

export interface SaveInterviewRequest {
  userId: string;
  role: string;
  level: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // in minutes
  transcript: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }>;
  feedback: {
    overallSummary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string;
  };
  overallScore: number;
}

export interface SaveInterviewResponse {
  success: boolean;
  interviewId: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class InterviewService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {}

  saveInterview(data: SaveInterviewRequest): Observable<SaveInterviewResponse> {
    const token = this.authService.getToken();

    return this.http.post<SaveInterviewResponse>(
      `${this.apiUrl}/api/interviews/save`,
      data,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
  }
}
