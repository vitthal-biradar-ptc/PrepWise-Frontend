import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { SignUp } from './sign-up';
import { AuthService, SignUpRequest } from '../../../services/authorization.service';

describe('SignUp', () => {
  let component: SignUp;
  let fixture: ComponentFixture<SignUp>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['signUp', 'setToken', 'validateToken']);

    await TestBed.configureTestingModule({
      imports: [SignUp, FormsModule, HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUp);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.email).toBe('');
      expect(component.username).toBe('');
      expect(component.name).toBe('');
      expect(component.password).toBe('');
      expect(component.confirmPassword).toBe('');
      expect(component.location).toBe('');
      expect(component.githubUsername).toBe('');
      expect(component.linkedinUsername).toBe('');
      expect(component.portfolioUrl).toBe('');
      expect(component.termsAccepted).toBe(false);
      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(false);
      expect(component.error).toBe('');
      expect(component.formErrors).toEqual({});
      expect(component.touchedFields).toEqual({});
    });
  });

  describe('Validation Helpers', () => {
    it('should validate email format', () => {
      expect(component.validateEmail('test@example.com')).toBeTrue();
      expect(component.validateEmail('invalid-email')).toBeFalse();
    });

    it('should validate password length', () => {
      expect(component.validatePassword('1234567')).toBeFalse();
      expect(component.validatePassword('12345678')).toBeTrue();
    });

    it('should validate username rules', () => {
      expect(component.validateUsername('ab')).toBeFalse();
      expect(component.validateUsername('valid_user_123')).toBeTrue();
      expect(component.validateUsername('invalid user')).toBeFalse();
    });

    it('should validate URL or accept empty', () => {
      expect(component.validateUrl('')).toBeTrue();
      expect(component.validateUrl('https://example.com')).toBeTrue();
      expect(component.validateUrl('not-a-url')).toBeFalse();
    });
  });

  describe('Field Validation and Errors', () => {
    it('should mark field as touched and validate', () => {
      component.name = '';
      component.markFieldAsTouched('name');
      expect(component.touchedFields['name']).toBeTrue();
      expect(component.formErrors['name']).toBe('Name is required');
    });

    it('should set errors for invalid fields and clear for valid', () => {
      component.username = 'a';
      component.validateField('username');
      expect(component.formErrors['username']).toContain('Username must be 3-20 characters');

      component.username = 'valid_user';
      component.validateField('username');
      expect(component.formErrors['username']).toBeUndefined();
    });

    it('should validate confirm password mismatch', () => {
      component.password = 'password123';
      component.confirmPassword = 'password124';
      component.validateField('confirmPassword');
      expect(component.formErrors['confirmPassword']).toBe('Passwords do not match');
    });

    it('should validate portfolioUrl', () => {
      component.portfolioUrl = 'invalid';
      component.validateField('portfolioUrl');
      expect(component.formErrors['portfolioUrl']).toBe('Please enter a valid URL');
    });

    it('should report hasFieldError only when touched and has error', () => {
      component.formErrors['email'] = 'Email is required';
      expect(component.hasFieldError('email')).toBeFalse();
      component.touchedFields['email'] = true;
      expect(component.hasFieldError('email')).toBeTrue();
    });
  });

  describe('Form Validation', () => {
    it('should invalidate form when fields are missing and terms not accepted', () => {
      component.termsAccepted = false;
      const isValid = component.validateForm();
      expect(isValid).toBeFalse();
      expect(Object.keys(component.formErrors).length).toBeGreaterThan(0);
      expect(component.formErrors['terms']).toBe('Please accept the Terms of Service and Privacy Policy');
    });

    it('should validate form when all rules satisfied', () => {
      component.name = 'Test User';
      component.username = 'test_user';
      component.email = 'test@example.com';
      component.location = 'City';
      component.password = 'password123';
      component.confirmPassword = 'password123';
      component.portfolioUrl = 'https://example.com';
      component.termsAccepted = true;

      const isValid = component.validateForm();
      expect(isValid).toBeTrue();
      expect(component.formErrors['terms']).toBeUndefined();
    });
  });

  describe('UI Helpers', () => {
    it('should hide error', () => {
      component.showError = true;
      component.error = 'Something';
      component.hideError();
      expect(component.showError).toBeFalse();
      expect(component.error).toBe('');
    });
  });

  describe('Form Submission', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);

      component.name = 'Test User';
      component.username = 'test_user';
      component.email = 'test@example.com';
      component.location = 'City';
      component.password = 'password123';
      component.confirmPassword = 'password123';
      component.portfolioUrl = '';
      component.githubUsername = 'octocat';
      component.linkedinUsername = 'john-doe';
      component.termsAccepted = true;
    });

    it('should prevent default and not submit when form invalid', fakeAsync(() => {
      component.termsAccepted = false;

      component.handleSubmit(mockEvent);
      tick();

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component.showError).toBeTrue();
      expect(component.error).toBe('Please fix the errors below and try again');
      expect(mockAuthService.signUp).not.toHaveBeenCalled();
    }));

    it('should submit valid form, set token, validate and navigate', fakeAsync(() => {
      const expectedPayload: SignUpRequest = {
        email: 'test@example.com',
        username: 'test_user',
        name: 'Test User',
        password: 'password123',
        location: 'City',
        githubUrl: 'https://github.com/octocat',
        linkedinUrl: 'https://www.linkedin.com/in/john-doe',
        portfolioLink: null
      };

      mockAuthService.signUp.and.returnValue(of({ token: 'token', tokenType: 'Bearer' } as any));
      mockAuthService.validateToken.and.returnValue(of(true));

      component.handleSubmit(mockEvent);
      tick();

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockAuthService.signUp).toHaveBeenCalledWith(expectedPayload);
      expect(mockAuthService.setToken).toHaveBeenCalledWith('token', 'Bearer');

      tick(1500);
      expect(router.navigate).toHaveBeenCalledWith(['/parse-resume'], { state: { firstTime: true } });
      expect(component.isLoading).toBeFalse();
      expect(component.showError).toBeFalse();
    }));

    it('should submit without optional urls when usernames empty', fakeAsync(() => {
      component.githubUsername = '';
      component.linkedinUsername = '';

      mockAuthService.signUp.and.returnValue(of({ token: 'token', tokenType: 'Bearer' } as any));
      mockAuthService.validateToken.and.returnValue(of(true));

      component.handleSubmit(mockEvent);
      tick();

      const [arg] = mockAuthService.signUp.calls.mostRecent().args as [SignUpRequest];
      expect(arg.githubUrl).toBeNull();
      expect(arg.linkedinUrl).toBeNull();
    }));

    it('should handle 400 with message', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 400, error: { message: 'Bad data' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.showError).toBeTrue();
      expect(component.error).toBe('Bad data');
    }));

    it('should handle 400 with errors map and set field errors', fakeAsync(() => {
      const backendErrors = { email: ['Invalid email'], username: ['Taken'] };
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 400, error: { errors: backendErrors } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.formErrors['email']).toBe('Invalid email');
      expect(component.formErrors['username']).toBe('Taken');
      expect(component.touchedFields['email']).toBeTrue();
      expect(component.touchedFields['username']).toBeTrue();
      expect(component.error).toBe('Please fix the highlighted errors');
    }));

    it('should handle 409 email exists', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 409, error: { message: 'email already exists' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.formErrors['email']).toBe('This email is already registered');
      expect(component.error).toBe('Email already exists');
    }));

    it('should handle 409 username exists', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 409, error: { message: 'username already exists' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.formErrors['username']).toBe('This username is already taken');
      expect(component.error).toBe('Username already exists');
    }));

    it('should handle 422 validation error', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 422, error: { message: 'Invalid' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.error).toBe('Invalid data provided. Please check your information.');
    }));

    it('should handle 429 rate limiting', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 429, error: { message: 'Too many' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.error).toBe('Too many attempts. Please try again later.');
    }));

    it('should handle network error (0)', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 0, error: { message: 'Network' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.error).toBe('Unable to connect to server. Please check your internet connection.');
    }));

    it('should handle server error (500+)', fakeAsync(() => {
      mockAuthService.signUp.and.returnValue(throwError(() => ({ status: 500, error: { message: 'Server' } })));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.error).toBe('Server error. Please try again later.');
    }));
  });
});


