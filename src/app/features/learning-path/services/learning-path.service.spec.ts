import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  LearningPathService,
  ApiLearningPath,
  ApiResource,
  ApiTask,
  ApiPeriod,
} from './learning-path.service';
import { AuthService } from '../../../services/authorization.service';
import { environment } from '../../../../environments/environment';

describe('LearningPathService', () => {
  let service: LearningPathService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockApiLearningPath: ApiLearningPath = {
    id: '123',
    skill: 'React',
    level: 'Intermediate',
    duration: 'medium-term',
    createdAt: '2024-01-15T10:30:00Z',
    userId: 'user123',
    learningPeriods: [
      {
        id: 1,
        period: 'Week 1-2',
        goal: 'Master React Basics',
        focusAreas: '["Components", "JSX", "Props"]',
        resources: [
          {
            id: 1,
            title: 'React Tutorial',
            url: 'https://react.dev/learn',
            type: 'tutorial',
          },
        ],
        tasks: [
          {
            id: 1,
            taskId: 'task-1',
            description: 'Create first React component',
            completed: false,
            estimatedHours: 4,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LearningPathService,
        { provide: AuthService, useValue: authSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(LearningPathService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authServiceSpy.getToken.and.returnValue('Bearer mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUserLearningPaths', () => {
    it('should fetch learning paths for a user', () => {
      const userId = 'user123';
      const mockResponse = [mockApiLearningPath];

      service.getUserLearningPaths(userId).subscribe((paths) => {
        expect(paths).toEqual(mockResponse);
        expect(paths.length).toBe(1);
        expect(paths[0].skill).toBe('React');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/user/user123`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-token'
      );
      req.flush(mockResponse);
    });

    it('should handle response with items wrapper', () => {
      const userId = 'user123';
      const mockResponse = { items: [mockApiLearningPath] };

      service.getUserLearningPaths(userId).subscribe((paths) => {
        expect(paths).toEqual([mockApiLearningPath]);
        expect(paths.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/user/user123`
      );
      req.flush(mockResponse);
    });

    it('should handle empty response gracefully', () => {
      const userId = 'user123';

      service.getUserLearningPaths(userId).subscribe((paths) => {
        expect(paths).toEqual([]);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/user/user123`
      );
      req.flush({});
    });

    it('should encode userId properly', () => {
      const userId = 'user@123.com';

      service.getUserLearningPaths(userId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/user/user%40123.com`
      );
      req.flush([]);
    });
  });

  describe('toCardItems', () => {
    it('should convert API items to card items with proper formatting', () => {
      const items = [mockApiLearningPath];
      const result = service.toCardItems(items);

      expect(result.length).toBe(1);
      expect(result[0].title).toBe('React (Intermediate)');
      expect(result[0].description).toContain('Level: Intermediate');
      expect(result[0].description).toContain('Duration: medium-term');
      expect(result[0].description).toContain('Created: ');
    });

    it('should handle missing fields gracefully', () => {
      const itemWithoutSkill: ApiLearningPath = {
        id: '456',
        duration: 'short-term',
      };
      const result = service.toCardItems([itemWithoutSkill]);

      expect(result[0].title).toBe('Learning Path');
      expect(result[0].description).toBe('Duration: short-term');
    });

    it('should handle invalid createdAt date', () => {
      const itemWithInvalidDate: ApiLearningPath = {
        ...mockApiLearningPath,
        createdAt: 'invalid-date',
      };
      const result = service.toCardItems([itemWithInvalidDate]);

      // The service actually includes "Created: Invalid Date" in the description
      // This matches the actual behavior where new Date('invalid-date') creates an Invalid Date
      expect(result[0].description).toContain('Created: Invalid Date');
    });
  });

  describe('mapToUiModel', () => {
    it('should map API model to UI model correctly', () => {
      const result = service.mapToUiModel(mockApiLearningPath);

      expect(result.duration).toBe('medium-term');
      expect(result.learningPath.length).toBe(1);
      expect(result.learningPath[0].period).toBe('Week 1-2');
      expect(result.learningPath[0].goal).toBe('Master React Basics');
      expect(result.learningPath[0].focusAreas).toEqual([
        'Components',
        'JSX',
        'Props',
      ]);
      expect(result.learningPath[0].resources.length).toBe(1);
      expect(result.learningPath[0].tasks.length).toBe(1);
    });

    it('should parse focus areas from JSON string', () => {
      const apiWithJsonFocus = {
        ...mockApiLearningPath,
        learningPeriods: [
          {
            ...mockApiLearningPath.learningPeriods![0],
            focusAreas: '["React Hooks", "State Management"]',
          },
        ],
      };

      const result = service.mapToUiModel(apiWithJsonFocus);
      expect(result.learningPath[0].focusAreas).toEqual([
        'React Hooks',
        'State Management',
      ]);
    });

    it('should parse focus areas from comma-separated string', () => {
      const apiWithCommaSeparated = {
        ...mockApiLearningPath,
        learningPeriods: [
          {
            ...mockApiLearningPath.learningPeriods![0],
            focusAreas: 'React Hooks, State Management, Testing',
          },
        ],
      };

      const result = service.mapToUiModel(apiWithCommaSeparated);
      expect(result.learningPath[0].focusAreas).toEqual([
        'React Hooks',
        'State Management',
        'Testing',
      ]);
    });

    it('should handle array focus areas', () => {
      const apiWithArrayFocus = {
        ...mockApiLearningPath,
        learningPeriods: [
          {
            ...mockApiLearningPath.learningPeriods![0],
            focusAreas: ['Direct Array', 'Focus Areas'],
          },
        ],
      };

      const result = service.mapToUiModel(apiWithArrayFocus);
      expect(result.learningPath[0].focusAreas).toEqual([
        'Direct Array',
        'Focus Areas',
      ]);
    });

    it('should handle missing or malformed data', () => {
      const minimalApi: ApiLearningPath = { id: '123' };
      const result = service.mapToUiModel(minimalApi);

      expect(result.duration).toBe('medium-term');
      expect(result.learningPath).toEqual([]);
    });

    it('should handle task ID mapping correctly', () => {
      const result = service.mapToUiModel(mockApiLearningPath);
      const task = result.learningPath[0].tasks[0];

      expect(task.id).toBe('task-1');
      expect(task.description).toBe('Create first React component');
      expect(task.completed).toBe(false);
      expect(task.estimatedHours).toBe(4);
    });

    it('should fallback to numeric ID when taskId is missing', () => {
      const apiWithoutTaskId = {
        ...mockApiLearningPath,
        learningPeriods: [
          {
            ...mockApiLearningPath.learningPeriods![0],
            tasks: [
              {
                id: 99,
                description: 'Task without taskId',
                completed: true,
                estimatedHours: 2,
              },
            ],
          },
        ],
      };

      const result = service.mapToUiModel(apiWithoutTaskId);
      expect(result.learningPath[0].tasks[0].id).toBe('99');
    });
  });

  describe('generateLearningPath', () => {
    it('should generate a new learning path', () => {
      const payload = {
        skill: 'Vue.js',
        level: 'Beginner',
        userId: 'user123',
      };

      service.generateLearningPath(payload).subscribe((result) => {
        expect(result).toEqual(mockApiLearningPath);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/generate`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-token'
      );
      req.flush(mockApiLearningPath);
    });

    it('should handle numeric userId', () => {
      const payload = {
        skill: 'Angular',
        level: 'Advanced',
        userId: 456,
      };

      service.generateLearningPath(payload).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/generate`
      );
      expect(req.request.body.userId).toBe(456);
      req.flush(mockApiLearningPath);
    });
  });

  describe('deleteLearningPath', () => {
    it('should delete a learning path', () => {
      const userId = 'user123';
      const pathId = 'path456';

      service.deleteLearningPath(userId, pathId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/delete/user123/path456`
      );
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer mock-token'
      );
      req.flush(null);
    });

    it('should encode userId and pathId properly', () => {
      const userId = 'user@test.com';
      const pathId = 'path#123';

      service.deleteLearningPath(userId, pathId).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/delete/user%40test.com/path%23123`
      );
      req.flush(null);
    });

    it('should handle numeric IDs', () => {
      service.deleteLearningPath(123, 456).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/learning-path/delete/123/456`
      );
      req.flush(null);
    });
  });
});
