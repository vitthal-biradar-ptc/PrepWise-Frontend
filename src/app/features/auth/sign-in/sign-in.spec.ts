import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SignIn } from './sign-in';
import {
  AuthService,
  SignInRequest,
} from '../../../services/authorization.service';

describe('SignIn', () => {
  let component: SignIn;
  let fixture: ComponentFixture<SignIn>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let originalLocalStorage: Storage;

  beforeEach(async () => {
    // Store original localStorage
    originalLocalStorage = window.localStorage;

    // Create mock localStorage
    let store: { [key: string]: string } = {};
    const mockLocalStorage = {
      getItem: jasmine
        .createSpy('getItem')
        .and.callFake((key: string) => store[key] || null),
      setItem: jasmine
        .createSpy('setItem')
        .and.callFake((key: string, value: string) => {
          store[key] = value;
        }),
      removeItem: jasmine
        .createSpy('removeItem')
        .and.callFake((key: string) => {
          delete store[key];
        }),
      clear: jasmine.createSpy('clear').and.callFake(() => {
        store = {};
      }),
    };

    // Replace window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Create service spies
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'signIn',
      'setToken',
      'validateToken',
    ]);
    await TestBed.configureTestingModule({
      imports: [
        SignIn,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignIn);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.usernameOrEmail).toBe('');
      expect(component.password).toBe('');
      expect(component.rememberMe).toBe(false);
      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(false);
      expect(component.showPassword).toBe(false);
      expect(component.isBlocked).toBe(false);
      expect(component.attemptCount).toBe(0);
    });

    it('should check for existing blocks on initialization', () => {
      const blockData = {
        until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 3,
      };

      // Set up localStorage mock to return block data
      (localStorage.getItem as jasmine.Spy).and.returnValue(
        JSON.stringify(blockData)
      );

      // Create new component to trigger constructor
      const newFixture = TestBed.createComponent(SignIn);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.isBlocked).toBe(true);
      expect(newComponent.attemptCount).toBe(3);
    });
  });

  describe('Form Validation', () => {
    describe('validateUsernameOrEmail', () => {
      it('should return invalid for empty input', () => {
        const result = component.validateUsernameOrEmail('');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Username or email is required');
      });

      it('should return invalid for input less than 3 characters', () => {
        const result = component.validateUsernameOrEmail('ab');
        expect(result.valid).toBe(false);
        expect(result.message).toBe(
          'Username or email must be at least 3 characters'
        );
      });

      it('should return valid for input with 3 or more characters', () => {
        const result = component.validateUsernameOrEmail('abc');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      it('should trim whitespace before validation', () => {
        const result = component.validateUsernameOrEmail('  abc  ');
        expect(result.valid).toBe(true);
      });
    });

    describe('validatePassword', () => {
      it('should return invalid for empty password', () => {
        const result = component.validatePassword('');
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password is required');
      });

      it('should return valid for non-empty password', () => {
        const result = component.validatePassword('password123');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });

    describe('Field Validation', () => {
      it('should mark field as touched and validate', () => {
        component.usernameOrEmail = 'ab';
        component.markFieldAsTouched('usernameOrEmail');

        expect(component.touchedFields['usernameOrEmail']).toBe(true);
        expect(component.formErrors['usernameOrEmail']).toBe(
          'Username or email must be at least 3 characters'
        );
      });

      it('should clear errors for valid fields', () => {
        component.formErrors['usernameOrEmail'] = 'Previous error';
        component.usernameOrEmail = 'validuser';
        component.validateField('usernameOrEmail');

        expect(component.formErrors['usernameOrEmail']).toBeUndefined();
      });

      it('should return true for hasFieldError when field is touched and has error', () => {
        component.touchedFields['usernameOrEmail'] = true;
        component.formErrors['usernameOrEmail'] = 'Error message';

        expect(component.hasFieldError('usernameOrEmail')).toBe(true);
      });

      it('should return false for hasFieldError when field is not touched', () => {
        component.formErrors['usernameOrEmail'] = 'Error message';

        expect(component.hasFieldError('usernameOrEmail')).toBeFalsy();
      });
    });

    describe('Form Validity', () => {
      it('should return false when form is invalid', () => {
        component.usernameOrEmail = '';
        component.password = '';

        expect(component.isFormValid).toBe(false);
      });

      it('should return true when form is valid', () => {
        component.usernameOrEmail = 'validuser';
        component.password = 'validpassword';

        expect(component.isFormValid).toBe(true);
      });

      it('should validate all fields for submission', () => {
        component.usernameOrEmail = '';
        component.password = '';

        const isValid = component.validateFormForSubmission();

        expect(isValid).toBe(false);
        expect(component.touchedFields['usernameOrEmail']).toBe(true);
        expect(component.touchedFields['password']).toBe(true);
        expect(Object.keys(component.formErrors).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should add failed attempt and block after max attempts', () => {
      component.attemptCount = 4;
      component.addFailedAttempt();

      expect(component.attemptCount).toBe(5);
      expect(component.isBlocked).toBe(true);
      expect(component.blockUntil).toBeInstanceOf(Date);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'signInBlock',
        jasmine.any(String)
      );
    });

    it('should clear block and reset attempts', () => {
      component.attemptCount = 5;
      component.isBlocked = true;
      component.blockUntil = new Date();

      component.clearBlock();

      expect(component.attemptCount).toBe(0);
      expect(component.isBlocked).toBe(false);
      expect(component.blockUntil).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('signInBlock');
    });

    it('should return correct time remaining', () => {
      const futureTime = new Date(Date.now() + 5 * 60 * 1000);
      component.blockUntil = futureTime;

      const timeRemaining = component.getBlockTimeRemaining();

      expect(timeRemaining).toBe('5 minutes');
    });

    it('should clear block when time has expired', () => {
      const pastTime = new Date(Date.now() - 1000);
      component.blockUntil = pastTime;
      component.isBlocked = true;
      spyOn(component, 'clearBlock').and.callThrough();

      const timeRemaining = component.getBlockTimeRemaining();

      expect(timeRemaining).toBe('');
      expect(component.clearBlock).toHaveBeenCalled();
    });
  });

  describe('UI Interactions', () => {
    it('should toggle password visibility', () => {
      expect(component.showPassword).toBe(false);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(true);

      component.togglePasswordVisibility();
      expect(component.showPassword).toBe(false);
    });

    it('should hide error messages', () => {
      component.showError = true;
      component.generalError = 'Test error';

      component.hideError();

      expect(component.showError).toBe(false);
      expect(component.generalError).toBe('');
    });
  });

  describe('Form Submission', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      component.usernameOrEmail = 'testuser';
      component.password = 'testpassword';
    });

    it('should prevent default form submission', fakeAsync(() => {
      mockAuthService.signIn.and.returnValue(
        of({ token: 'test-token', tokenType: 'Bearer', expiresIn: '3600' })
      );
      mockAuthService.validateToken.and.returnValue(of(true));

      component.handleSubmit(mockEvent);
      tick();

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    }));

    it('should not submit when blocked', fakeAsync(() => {
      component.isBlocked = true;
      component.blockUntil = new Date(Date.now() + 5 * 60 * 1000);

      component.handleSubmit(mockEvent);
      tick();

      expect(component.showError).toBe(true);
      expect(component.generalError).toContain('temporarily blocked');
      expect(mockAuthService.signIn).not.toHaveBeenCalled();
    }));

    it('should not submit invalid form', fakeAsync(() => {
      component.usernameOrEmail = '';
      component.password = '';

      component.handleSubmit(mockEvent);
      tick();

      expect(component.showError).toBe(true);
      expect(component.generalError).toBe(
        'Please fix the errors below and try again'
      );
      expect(mockAuthService.signIn).not.toHaveBeenCalled();
    }));

    it('should submit valid form and handle success', fakeAsync(() => {
      mockAuthService.signIn.and.returnValue(
        of({ token: 'test-token', tokenType: 'Bearer', expiresIn: '3600' })
      );
      mockAuthService.validateToken.and.returnValue(of(true));

      component.handleSubmit(mockEvent);
      tick();

      expect(mockAuthService.signIn).toHaveBeenCalledWith({
        usernameOrEmail: 'testuser',
        password: 'testpassword',
      });
      expect(mockAuthService.setToken).toHaveBeenCalledWith(
        'test-token',
        'Bearer'
      );

      tick(1500);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/user']);
    }));

    it('should handle sign in error (401)', fakeAsync(() => {
      const error = { status: 401, error: { message: 'Invalid credentials' } };
      mockAuthService.signIn.and.returnValue(throwError(() => error));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(true);
      expect(component.generalError).toBe('Invalid username/email or password');
      expect(component.password).toBe('');
      expect(component.attemptCount).toBe(1);
    }));

    it('should handle sign in error (400)', fakeAsync(() => {
      const error = { status: 400, error: { error: 'Bad request' } };
      mockAuthService.signIn.and.returnValue(throwError(() => error));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(true);
      expect(component.generalError).toBe('Bad request');
    }));

    it('should handle server error (500)', fakeAsync(() => {
      const error = { status: 500, error: { message: 'Server error' } };
      mockAuthService.signIn.and.returnValue(throwError(() => error));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(true);
      expect(component.generalError).toBe(
        'Server error. Please try again later.'
      );
    }));

    it('should handle network error (0)', fakeAsync(() => {
      const error = { status: 0, error: { message: 'Network error' } };
      mockAuthService.signIn.and.returnValue(throwError(() => error));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(true);
      expect(component.generalError).toBe(
        'Unable to connect to server. Please check your internet connection.'
      );
    }));

    it('should handle rate limiting error (429)', fakeAsync(() => {
      const error = { status: 429, error: { message: 'Too many requests' } };
      mockAuthService.signIn.and.returnValue(throwError(() => error));

      component.handleSubmit(mockEvent);
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(true);
      expect(component.generalError).toBe(
        'Too many attempts. Please try again later.'
      );
      expect(component.attemptCount).toBe(1);
    }));

    it('should handle token validation error', fakeAsync(() => {
      mockAuthService.signIn.and.returnValue(
        of({ token: 'test-token', tokenType: 'Bearer', expiresIn: '3600' })
      );
      mockAuthService.validateToken.and.returnValue(
        throwError(() => new Error('Validation failed'))
      );

      component.handleSubmit(mockEvent);
      tick();
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.showError).toBe(true);
      expect(component.generalError).toBe('Authentication error');
    }));

    it('should reset form after successful submission', fakeAsync(() => {
      component.formErrors = { test: 'error' };
      component.touchedFields = { test: true };
      component.showPassword = true;

      mockAuthService.signIn.and.returnValue(
        of({ token: 'test-token', tokenType: 'Bearer', expiresIn: '3600' })
      );
      mockAuthService.validateToken.and.returnValue(of(true));

      component.handleSubmit(mockEvent);
      tick();
      tick(1500);
      tick();

      expect(component.usernameOrEmail).toBe('');
      expect(component.password).toBe('');
      expect(component.rememberMe).toBe(false);
      expect(component.showError).toBe(false);
      expect(component.generalError).toBe('');
      expect(component.formErrors).toEqual({});
      expect(component.touchedFields).toEqual({});
      expect(component.showPassword).toBe(false);
    }));
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe from all subscriptions on destroy', () => {
      const mockSubscription1 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      const mockSubscription2 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      component['subscriptions'] = [mockSubscription1, mockSubscription2];

      component.ngOnDestroy();

      expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
      expect(mockSubscription2.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Platform-specific behavior', () => {
    it('should not access localStorage on server platform', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          SignIn,
          FormsModule,
          HttpClientTestingModule,
          RouterTestingModule.withRoutes([]),
        ],
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      }).compileComponents();

      const serverFixture = TestBed.createComponent(SignIn);
      const serverComponent = serverFixture.componentInstance;

      (localStorage.setItem as jasmine.Spy).calls.reset();

      serverComponent.addFailedAttempt();

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      (localStorage.getItem as jasmine.Spy).and.throwError(
        new Error('Storage error')
      );
      spyOn(console, 'warn');

      component.checkIfBlocked();

      expect(console.warn).toHaveBeenCalledWith(
        'Error accessing localStorage:',
        jasmine.any(Error)
      );
    });

    it('should handle malformed localStorage data', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid json');
      spyOn(console, 'warn');

      component.checkIfBlocked();

      expect(console.warn).toHaveBeenCalledWith(
        'Error accessing localStorage:',
        jasmine.any(SyntaxError)
      );
    });
  });
});
