import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ResumeAnalyzerService } from './resume-analyzer.service';
import { AuthService } from '../../../services/authorization.service';
import {
  ResumeAnalysisResponse,
  ResumeAnalysisRequest,
} from '../../../models/resume-analysis.model';

describe('ResumeAnalyzerService', () => {
  let service: ResumeAnalyzerService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockApiUrl = 'http://localhost:3000';
  const mockResponse: ResumeAnalysisResponse = {
    domain: 'Software Engineering',
    suggestions: [
      'Add more technical skills to your resume',
      'Include quantifiable achievements',
      'Improve the summary section',
    ],
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ResumeAnalyzerService,
        { provide: AuthService, useValue: authSpy },
      ],
    });

    service = TestBed.inject(ResumeAnalyzerService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Mock the private baseUrl property
    (service as any).baseUrl = mockApiUrl;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('analyzeResumeFile', () => {
    it('should send PDF file to backend and return analysis response', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeFile(mockFile).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-resume`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer test-token'
      );
      expect(req.request.body instanceof FormData).toBeTruthy();

      const formData = req.request.body as FormData;
      expect(formData.get('file')).toBe(mockFile);

      req.flush(mockResponse);
    });

    it('should handle authentication token missing', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      authServiceSpy.getToken.and.returnValue(null);

      service.analyzeResumeFile(mockFile).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-resume`);
      expect(req.request.headers.get('Authorization')).toBe('');
      req.flush(mockResponse);
    });

    it('should handle HTTP error', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeFile(mockFile).subscribe({
        next: () => fail('should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-resume`);
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('analyzeResumeText', () => {
    it('should send text to backend and return analysis response', () => {
      const testText = 'Software Engineer with 5 years experience...';
      const expectedRequest: ResumeAnalysisRequest = { prompt: testText };
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeText(testText).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-text`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer test-token'
      );
      expect(req.request.body).toEqual(expectedRequest);

      req.flush(mockResponse);
    });

    it('should handle empty text input', () => {
      const testText = '';
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeText(testText).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-text`);
      expect(req.request.body).toEqual({ prompt: '' });
      req.flush(mockResponse);
    });
  });

  describe('analyzeResume', () => {
    it('should call analyzeResumeFile when file is provided', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      spyOn(service, 'analyzeResumeFile').and.returnValue(of(mockResponse));

      const result = service.analyzeResume({ file: mockFile });

      expect(service.analyzeResumeFile).toHaveBeenCalledWith(mockFile);
      expect(result).toBeDefined();
    });

    it('should call analyzeResumeText when text is provided', () => {
      const testText = 'Software Engineer with experience...';
      spyOn(service, 'analyzeResumeText').and.returnValue(of(mockResponse));

      const result = service.analyzeResume({ text: testText });

      expect(service.analyzeResumeText).toHaveBeenCalledWith(testText);
      expect(result).toBeDefined();
    });

    it('should throw error when neither file nor text is provided', () => {
      expect(() => service.analyzeResume({})).toThrowError(
        'Either file or text must be provided for analysis'
      );
    });

    it('should prioritize file over text when both are provided', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      const testText = 'Software Engineer...';
      spyOn(service, 'analyzeResumeFile').and.returnValue(of(mockResponse));
      spyOn(service, 'analyzeResumeText');

      service.analyzeResume({ file: mockFile, text: testText });

      expect(service.analyzeResumeFile).toHaveBeenCalledWith(mockFile);
      expect(service.analyzeResumeText).not.toHaveBeenCalled();
    });
  });

  describe('analyzeResumeAndRedirect', () => {
    it('should call different endpoint for redirect functionality', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeAndRedirect(mockFile).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/analyze-resume`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('analyzeTextAndRedirect', () => {
    it('should call different endpoint for text redirect functionality', () => {
      const testText = 'Software Engineer...';
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeTextAndRedirect(testText).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${mockApiUrl}/analyze-text`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeFile(mockFile).subscribe({
        next: () => fail('should have failed'),
        error: (error: any) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-resume`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle 401 unauthorized error', () => {
      const mockFile = new File(['test content'], 'test-resume.pdf', {
        type: 'application/pdf',
      });
      authServiceSpy.getToken.and.returnValue('invalid-token');

      service.analyzeResumeFile(mockFile).subscribe({
        next: () => fail('should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-resume`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 400 bad request error', () => {
      const invalidText = '';
      authServiceSpy.getToken.and.returnValue('Bearer test-token');

      service.analyzeResumeText(invalidText).subscribe({
        next: () => fail('should have failed'),
        error: (error: any) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/api/analyze-text`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });
});
