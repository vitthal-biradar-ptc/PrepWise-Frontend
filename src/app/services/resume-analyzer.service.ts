import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResumeAnalysisResponse, ResumeAnalysisRequest } from '../models/resume-analysis.model';

@Injectable({
  providedIn: 'root'
})
export class ResumeAnalyzerService {
  private baseUrl = 'http://localhost:8080/api/gemini';

  constructor(private http: HttpClient) {}

  analyzeResumeFile(file: File): Observable<ResumeAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/analyze-resume`, formData);
  }

  analyzeResumeText(text: string): Observable<ResumeAnalysisResponse> {
    const request: ResumeAnalysisRequest = { prompt: text };
    
    return this.http.post<ResumeAnalysisResponse>(`${this.baseUrl}/analyze-text`, request);
  }
}

