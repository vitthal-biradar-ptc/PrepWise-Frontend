import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ResumeAnalysisResponse, ResumeAnalysisRequest } from '../models/resume-analysis.model';
import { AuthService } from './authorization.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResumeAnalyzerService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token || ''
    });
  }

  analyzeResumeFile(file: File): Observable<ResumeAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/api/analyze-resume`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  analyzeResumeText(text: string): Observable<ResumeAnalysisResponse> {
    const request: ResumeAnalysisRequest = { prompt: text };
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/api/analyze-text`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Unified method for backwards compatibility and easier usage
  analyzeResume(data: { file?: File; text?: string }): Observable<ResumeAnalysisResponse> {
    if (data.file) {
      return this.analyzeResumeFile(data.file);
    } else if (data.text) {
      return this.analyzeResumeText(data.text);
    } else {
      throw new Error('Either file or text must be provided for analysis');
    }
  }

  analyzeResumeAndRedirect(file: File): Observable<ResumeAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/analyze-resume`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  analyzeTextAndRedirect(text: string): Observable<ResumeAnalysisResponse> {
    const request: ResumeAnalysisRequest = { prompt: text };
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/analyze-text`, request, {
      headers: this.getAuthHeaders()
    });
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
}
