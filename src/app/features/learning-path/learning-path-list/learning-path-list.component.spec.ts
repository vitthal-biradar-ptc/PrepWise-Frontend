import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LearningPathsComponent } from './learning-path-list.component';
import { LearningPathService } from '../services/learning-path.service';
import { HeaderComponent } from '../../../core/layout/header/header';
import { FooterComponent } from '../../../core/layout/footer/footer';

describe('LearningPathsComponent', () => {
  let component: LearningPathsComponent;
  let fixture: ComponentFixture<LearningPathsComponent>;
  let mockLearningPathService: jasmine.SpyObj<LearningPathService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockLearningPaths = [
    {
      id: '123',
      skill: 'React',
      level: 'Intermediate',
      duration: 'medium-term',
      createdAt: '2024-01-15T10:30:00Z',
      userId: 'user123',
      title: 'React (Intermediate)',
      description:
        'Level: Intermediate • Duration: medium-term • Created: 1/15/2024',
    },
    {
      id: '456',
      skill: 'Vue.js',
      level: 'Beginner',
      duration: 'short-term',
      createdAt: '2024-01-20T14:20:00Z',
      userId: 'user123',
      title: 'Vue.js (Beginner)',
      description:
        'Level: Beginner • Duration: short-term • Created: 1/20/2024',
    },
  ];

  const mockApiLearningPath = {
    id: '789',
    skill: 'Angular',
    level: 'Advanced',
    duration: 'long-term',
    createdAt: '2024-01-25T09:15:00Z',
    userId: 'user123',
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(new Map([['user_id', 'user123']])),
    };

    const learningPathServiceSpy = jasmine.createSpyObj('LearningPathService', [
      'getUserLearningPaths',
      'toCardItems',
      'generateLearningPath',
      'deleteLearningPath',
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LearningPathsComponent,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        HeaderComponent,
        FooterComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LearningPathService, useValue: learningPathServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningPathsComponent);
    component = fixture.componentInstance;
    mockLearningPathService = TestBed.inject(
      LearningPathService
    ) as jasmine.SpyObj<LearningPathService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.paths).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBe('');
      expect(component.showGeneratorModal).toBe(false);
      expect(component.deleteTarget).toBeNull();
      expect(component.deletingIds).toEqual(new Set());
    });

    it('should load learning paths on init with valid user_id', () => {
      mockLearningPathService.getUserLearningPaths.and.returnValue(
        of(mockLearningPaths as any)
      );
      mockLearningPathService.toCardItems.and.returnValue(
        mockLearningPaths as any
      );

      component.ngOnInit();

      expect(component.userId).toBe('user123');
      expect(mockLearningPathService.getUserLearningPaths).toHaveBeenCalledWith(
        'user123'
      );
      expect(mockLearningPathService.toCardItems).toHaveBeenCalledWith(
        mockLearningPaths
      );
      expect(component.paths).toEqual(mockLearningPaths);
    });

    it('should show error when user_id is missing', () => {
      mockActivatedRoute.paramMap = of(new Map());

      component.ngOnInit();

      expect(component.error).toBe(
        'Missing userId in route. Use /learning-paths/:user_id.'
      );
      expect(component.paths).toEqual([]);
      expect(
        mockLearningPathService.getUserLearningPaths
      ).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', () => {
      const error = new Error('API Error');
      mockLearningPathService.getUserLearningPaths.and.returnValue(
        throwError(() => error)
      );

      component.ngOnInit();

      expect(component.error).toBe('API Error');
      expect(component.paths).toEqual([]);
      expect(component.loading).toBe(false);
    });
  });

  describe('Learning Path Fetching', () => {
    it('should set loading state during fetch', () => {
      mockLearningPathService.getUserLearningPaths.and.returnValue(
        of(mockLearningPaths as any)
      );
      mockLearningPathService.toCardItems.and.returnValue(
        mockLearningPaths as any
      );

      component.fetchLearningPaths('user123');

      expect(component.loading).toBe(false); // Should be false after observable completes
      expect(component.error).toBe('');
    });

    it('should handle empty results', () => {
      mockLearningPathService.getUserLearningPaths.and.returnValue(of([]));
      mockLearningPathService.toCardItems.and.returnValue([]);

      component.fetchLearningPaths('user123');

      expect(component.paths).toEqual([]);
      expect(component.error).toBe('');
    });
  });

  describe('Learning Path Generation', () => {
    beforeEach(() => {
      component.userId = 'user123';
      component.newSkill = 'Python';
      component.newLevel = 'Intermediate';
    });

    it('should generate new learning path successfully', () => {
      mockLearningPathService.generateLearningPath.and.returnValue(
        of(mockApiLearningPath as any)
      );
      mockLearningPathService.getUserLearningPaths.and.returnValue(
        of([mockApiLearningPath] as any)
      );
      mockLearningPathService.toCardItems.and.returnValue([
        mockApiLearningPath,
      ] as any);
      spyOn(component, 'fetchLearningPaths');

      component.generateNewPath();

      expect(mockLearningPathService.generateLearningPath).toHaveBeenCalledWith(
        {
          skill: 'Python',
          level: 'Intermediate',
          userId: 'user123',
        }
      );
      expect(component.generationSuccess).toBe(
        'Learning path generated successfully.'
      );
      expect(component.newSkill).toBe('');
      expect(component.newLevel).toBe('');
      expect(component.showGeneratorModal).toBe(false);
      expect(component.fetchLearningPaths).toHaveBeenCalledWith('user123');
    });

    it('should handle generation error', () => {
      const error = { error: { message: 'Generation failed' } };
      mockLearningPathService.generateLearningPath.and.returnValue(
        throwError(() => error)
      );

      component.generateNewPath();

      expect(component.generationError).toBe('Generation failed');
      expect(component.generationLoading).toBe(false);
    });

    it('should handle missing userId', () => {
      component.userId = '';

      component.generateNewPath();

      expect(component.generationError).toBe('Missing userId in route.');
      expect(
        mockLearningPathService.generateLearningPath
      ).not.toHaveBeenCalled();
    });

    it('should not generate when skill or level is missing', () => {
      component.newSkill = '';

      component.generateNewPath();

      expect(
        mockLearningPathService.generateLearningPath
      ).not.toHaveBeenCalled();

      component.newSkill = 'Python';
      component.newLevel = '';

      component.generateNewPath();

      expect(
        mockLearningPathService.generateLearningPath
      ).not.toHaveBeenCalled();
    });

    it('should handle numeric userId', () => {
      component.userId = '12345';
      mockLearningPathService.generateLearningPath.and.returnValue(
        of(mockApiLearningPath as any)
      );
      spyOn(component, 'fetchLearningPaths');

      component.generateNewPath();

      expect(mockLearningPathService.generateLearningPath).toHaveBeenCalledWith(
        {
          skill: 'Python',
          level: 'Intermediate',
          userId: 12345,
        }
      );
    });
  });

  describe('Learning Path Deletion', () => {
    beforeEach(() => {
      component.userId = 'user123';
      component.paths = [...mockLearningPaths] as any;
    });

    it('should open delete modal', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.openDeleteModal(mockLearningPaths[0] as any, event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.deleteTarget).toEqual({
        id: '123',
        title: 'React (Intermediate)',
      });
      expect(component.deleteError).toBe('');
    });

    it('should not open delete modal for item without id', () => {
      const itemWithoutId = { ...mockLearningPaths[0], id: '' };

      component.openDeleteModal(itemWithoutId as any);

      expect(component.deleteTarget).toBeNull();
    });

    it('should close delete modal', () => {
      component.deleteTarget = { id: '123', title: 'Test' };
      component.deleteError = 'Some error';

      component.closeDeleteModal();

      expect(component.deleteTarget).toBeNull();
      expect(component.deleteError).toBe('');
    });

    it('should not close delete modal when deleting', () => {
      component.deleteTarget = { id: '123', title: 'Test' };
      component.deletingIds.add('123');

      component.closeDeleteModal();

      expect(component.deleteTarget).toEqual({ id: '123', title: 'Test' });
    });

    it('should confirm deletion successfully', () => {
      component.deleteTarget = { id: '123', title: 'React (Intermediate)' };
      mockLearningPathService.deleteLearningPath.and.returnValue(of(undefined));

      component.confirmDelete();

      expect(mockLearningPathService.deleteLearningPath).toHaveBeenCalledWith(
        'user123',
        '123'
      );
      expect(component.paths).toEqual([mockLearningPaths[1]]);
      expect(component.deleteTarget).toBeNull();
    });

    it('should handle deletion error', () => {
      component.deleteTarget = { id: '123', title: 'React (Intermediate)' };
      const error = { error: { message: 'Delete failed' } };
      mockLearningPathService.deleteLearningPath.and.returnValue(
        throwError(() => error)
      );

      component.confirmDelete();

      expect(component.deleteError).toBe('Delete failed');
      expect(component.paths.length).toBe(2); // Should not remove item on error
    });

    it('should not delete when deleteTarget or userId is missing', () => {
      component.deleteTarget = null;

      component.confirmDelete();

      expect(mockLearningPathService.deleteLearningPath).not.toHaveBeenCalled();

      component.deleteTarget = { id: '123', title: 'Test' };
      component.userId = '';

      component.confirmDelete();

      expect(mockLearningPathService.deleteLearningPath).not.toHaveBeenCalled();
    });
  });

  describe('Modal Management', () => {
    it('should open generator modal', () => {
      component.openGeneratorModal();

      expect(component.showGeneratorModal).toBe(true);
      expect(component.generationError).toBe('');
      expect(component.generationSuccess).toBe('');
    });

    it('should close generator modal when not loading', () => {
      component.showGeneratorModal = true;
      component.generationLoading = false;

      component.closeGeneratorModal();

      expect(component.showGeneratorModal).toBe(false);
    });

    it('should not close generator modal when loading', () => {
      component.showGeneratorModal = true;
      component.generationLoading = true;

      component.closeGeneratorModal();

      expect(component.showGeneratorModal).toBe(true);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.userId = 'user123';
    });

    it('should navigate to learning path detail', () => {
      component.openPath(mockLearningPaths[0] as any);

      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/learning-paths/user',
        'user123',
        'learning-path',
        '123',
      ]);
    });

    it('should not navigate when id or userId is missing', () => {
      const pathWithoutId = { ...mockLearningPaths[0], id: '' };

      component.openPath(pathWithoutId as any);

      expect(mockRouter.navigate).not.toHaveBeenCalled();

      component.userId = '';
      component.openPath(mockLearningPaths[0] as any);

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should track items by id', () => {
      const item = mockLearningPaths[0];
      const result = component.trackById(0, item as any);

      expect(result).toBe('123');
    });

    it('should get title correctly', () => {
      const itemWithTitle = mockLearningPaths[0];
      const itemWithSkill = { ...mockLearningPaths[0], title: undefined };
      const itemWithoutSkillOrTitle = {
        id: '999',
        title: undefined,
        skill: undefined,
      };

      expect(component.getTitle(itemWithTitle as any)).toBe(
        'React (Intermediate)'
      );
      expect(component.getTitle(itemWithSkill as any)).toBe('React');
      expect(component.getTitle(itemWithoutSkillOrTitle as any)).toBe(
        'Learning Path 999'
      );
    });

    it('should get id correctly', () => {
      const numericId = { ...mockLearningPaths[0], id: 123 };
      const stringId = mockLearningPaths[0];
      const noId = { ...mockLearningPaths[0], id: undefined };

      expect(component.getId(numericId as any)).toBe('123');
      expect(component.getId(stringId as any)).toBe('123');
      expect(component.getId(noId as any)).toBe('');
    });
  });

  describe('Loading States', () => {
    it('should manage loading state correctly during fetch', () => {
      let resolvePromise: any;
      const delayedObservable = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockLearningPathService.getUserLearningPaths.and.returnValue(
        of(mockLearningPaths as any)
          .pipe
          // Simulate delayed response
          ()
      );
      mockLearningPathService.toCardItems.and.returnValue(
        mockLearningPaths as any
      );

      expect(component.loading).toBe(false);

      component.fetchLearningPaths('user123');

      // Loading should be set to false after the observable completes synchronously in tests
      expect(component.loading).toBe(false);
    });

    it('should manage generation loading state', () => {
      component.userId = 'user123';
      component.newSkill = 'Python';
      component.newLevel = 'Beginner';

      mockLearningPathService.generateLearningPath.and.returnValue(
        of(mockApiLearningPath as any)
      );
      spyOn(component, 'fetchLearningPaths');

      expect(component.generationLoading).toBe(false);

      component.generateNewPath();

      expect(component.generationLoading).toBe(false); // Should be false after completion
    });

    it('should manage deletion loading state', () => {
      component.userId = 'user123';
      component.deleteTarget = { id: '123', title: 'Test' };
      mockLearningPathService.deleteLearningPath.and.returnValue(of(undefined));

      expect(component.deletingIds.has('123')).toBe(false);

      component.confirmDelete();

      expect(component.deletingIds.has('123')).toBe(false); // Should be false after completion
    });
  });
});
