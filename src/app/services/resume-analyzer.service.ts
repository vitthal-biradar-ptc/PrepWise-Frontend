import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumeAnalysisResponse, ResumeAnalysisRequest } from '../models/resume-analysis.model';
import { AuthService } from './authorization.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ResumeAnalyzerService {
  private baseUrl = 'http://localhost:8080/api/gemini';

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
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/analyze-resume`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  analyzeResumeText(text: string): Observable<ResumeAnalysisResponse> {
    const request: ResumeAnalysisRequest = { prompt: text };
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/analyze-text`, request, {
      headers: this.getAuthHeaders()
    });
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
}

