import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './authorization.service';
import { ParsedResumeResponse } from '../models/parsed-resume.model';
import { environment } from '../../environments/environment';

/**
 * Uploads resumes to the backend for structured parsing.
 */
@Injectable({
  providedIn: 'root'
})
export class ResumeParseService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** Build Authorization headers from stored token. */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token || ''
    });
  }

  parseResume(file: File): Observable<ParsedResumeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ParsedResumeResponse>(`${this.baseUrl}/api/parse-resume`, formData, {
      headers: this.getAuthHeaders()
    });
  }
}
