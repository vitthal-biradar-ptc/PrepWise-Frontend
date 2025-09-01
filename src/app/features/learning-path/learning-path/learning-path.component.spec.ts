import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LearningPathComponent } from './learning-path.component';
import { LearningPathService } from '../services/learning-path.service';
import { HeaderComponent } from '../../../core/layout/header/header';
import { FooterComponent } from '../../../core/layout/footer/footer';

describe('LearningPathComponent', () => {
  let component: LearningPathComponent;
  let fixture: ComponentFixture<LearningPathComponent>;
  let mockLearningPathService: jasmine.SpyObj<LearningPathService>;
  let mockActivatedRoute: any;

  const mockLearningPathData = {
    duration: 'medium-term' as const,
    learningPath: [
      {
        period: 'Week 1-2',
        goal: 'Master React Basics',
        focusAreas: ['Components', 'JSX', 'Props'],
        resources: [
          {
            title: 'React Tutorial',
            url: 'https://react.dev/learn',
            type: 'tutorial' as const,
          },
        ],
        tasks: [
          {
            id: 'task-1',
            description: 'Create first React component',
            completed: false,
            estimatedHours: 4,
          },
          {
            id: 'task-2',
            description: 'Build todo app',
            completed: true,
            estimatedHours: 8,
          },
        ],
      },
      {
        period: 'Week 3-4',
        goal: 'Advanced Concepts',
        focusAreas: ['Hooks', 'Context'],
        resources: [],
        tasks: [
          {
            id: 'task-3',
            description: 'Implement custom hooks',
            completed: false,
            estimatedHours: 6,
          },
        ],
      },
    ],
  };

  const mockApiLearningPath = {
    id: '123',
    skill: 'React',
    level: 'Intermediate',
    duration: 'medium-term',
    createdAt: '2024-01-15T10:30:00Z',
    userId: 'user123',
    learningPeriods: [],
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(
        new Map([
          ['user_id', 'user123'],
          ['path_id', 'path456'],
        ])
      ),
    };

    const learningPathServiceSpy = jasmine.createSpyObj('LearningPathService', [
      'getUserLearningPaths',
      'mapToUiModel',
      'generateLearningPath',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        LearningPathComponent,
        FormsModule,
        HttpClientTestingModule,
        HeaderComponent,
        FooterComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: LearningPathService, useValue: learningPathServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningPathComponent);
    component = fixture.componentInstance;
    mockLearningPathService = TestBed.inject(
      LearningPathService
    ) as jasmine.SpyObj<LearningPathService>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.learningPathData).toBeNull();
      expect(component.expandedPeriods).toEqual(new Set());
      expect(component.overallProgress).toBe(0);
      expect(component.periodProgress).toEqual([]);
      expect(component.showGeneratorModal).toBe(false);
    });

    it('should use static data when route params are missing', () => {
      mockActivatedRoute.paramMap = of(new Map());

      component.ngOnInit();

      expect(component.learningPathData).toEqual(
        component['staticLearningPath']
      );
      expect(
        mockLearningPathService.getUserLearningPaths
      ).not.toHaveBeenCalled();
    });

    it('should use static data when API call fails', () => {
      mockLearningPathService.getUserLearningPaths.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(component.learningPathData).toEqual(
        component['staticLearningPath']
      );
    });

    it('should use static data when no matching path found', () => {
      mockLearningPathService.getUserLearningPaths.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.learningPathData).toEqual(
        component['staticLearningPath']
      );
    });
  });

  describe('Progress Calculation', () => {
    beforeEach(() => {
      component.learningPathData = mockLearningPathData;
    });

    it('should handle empty learning path', () => {
      component.learningPathData = { duration: 'short-term', learningPath: [] };
      component['calculateProgress']();

      expect(component.overallProgress).toBe(0);
      expect(component.periodProgress).toEqual([]);
    });

    it('should calculate progress with static data', () => {
      // Use actual static data to test progress calculation
      component.learningPathData = component['staticLearningPath'];
      component['calculateProgress']();

      // Static data has 4 periods with multiple tasks, none completed initially
      expect(component.overallProgress).toBe(0);
      expect(component.periodProgress.length).toBe(4);
      expect(component.periodProgress).toEqual([0, 0, 0, 0]);
    });
  });

  describe('Task Management', () => {
    beforeEach(() => {
      component.learningPathData = mockLearningPathData;
      spyOn(component as any, 'saveCompletionState');
      spyOn(component as any, 'calculateProgress');
    });

    it('should toggle task completion', () => {
      const initialState =
        component.learningPathData?.learningPath[0].tasks[0].completed;

      component.toggleTask(0, 0);

      expect(
        component.learningPathData?.learningPath[0].tasks[0].completed
      ).toBe(!initialState);
      expect(component['saveCompletionState']).toHaveBeenCalled();
      expect(component['calculateProgress']).toHaveBeenCalled();
    });

    it('should not toggle task when learningPathData is null', () => {
      component.learningPathData = null;

      component.toggleTask(0, 0);

      expect(component['saveCompletionState']).not.toHaveBeenCalled();
    });
  });

  describe('Period Expansion', () => {
    it('should toggle period expansion', () => {
      expect(component.isPeriodExpanded(0)).toBe(false);

      component.togglePeriod(0);
      expect(component.isPeriodExpanded(0)).toBe(true);

      component.togglePeriod(0);
      expect(component.isPeriodExpanded(0)).toBe(false);
    });

    it('should track multiple expanded periods', () => {
      component.togglePeriod(0);
      component.togglePeriod(2);

      expect(component.expandedPeriods.has(0)).toBe(true);
      expect(component.expandedPeriods.has(1)).toBe(false);
      expect(component.expandedPeriods.has(2)).toBe(true);
    });
  });

  describe('Modal Management', () => {
    it('should open generator modal', () => {
      component.openGeneratorModal();

      expect(component.showGeneratorModal).toBe(true);
      expect(component.generationError).toBe('');
      expect(component.newSkill).toBe('');
      expect(component.newLevel).toBe('');
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

  describe('Learning Path Generation', () => {
    beforeEach(() => {
      component['userId'] = 'user123';
      component.newSkill = 'Vue.js';
      component.newLevel = 'Beginner';
    });

    it('should generate new learning path successfully', () => {
      const newMockPath = { ...mockApiLearningPath, skill: 'Vue.js' };
      mockLearningPathService.generateLearningPath.and.returnValue(
        of(newMockPath)
      );
      mockLearningPathService.mapToUiModel.and.returnValue(
        mockLearningPathData as any
      );
      spyOn(component as any, 'loadCompletionState');
      spyOn(component as any, 'calculateProgress');

      component.generateNewPath();

      expect(mockLearningPathService.generateLearningPath).toHaveBeenCalledWith(
        {
          skill: 'Vue.js',
          level: 'Beginner',
          userId: 'user123',
        }
      );
      expect(component.showGeneratorModal).toBe(false);
      expect(component.newSkill).toBe('');
      expect(component.newLevel).toBe('');
      expect(component['loadCompletionState']).toHaveBeenCalled();
      expect(component['calculateProgress']).toHaveBeenCalled();
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
      component['userId'] = '';

      component.generateNewPath();

      expect(component.generationError).toBe('Missing userId.');
      expect(
        mockLearningPathService.generateLearningPath
      ).not.toHaveBeenCalled();
    });

    it('should not generate when skill or level is empty', () => {
      component.newSkill = '';

      component.generateNewPath();

      expect(
        mockLearningPathService.generateLearningPath
      ).not.toHaveBeenCalled();
    });

    it('should handle numeric userId', () => {
      component['userId'] = '12345';
      mockLearningPathService.generateLearningPath.and.returnValue(
        of(mockApiLearningPath)
      );
      mockLearningPathService.mapToUiModel.and.returnValue(
        mockLearningPathData as any
      );

      component.generateNewPath();

      expect(mockLearningPathService.generateLearningPath).toHaveBeenCalledWith(
        {
          skill: 'Vue.js',
          level: 'Beginner',
          userId: 12345,
        }
      );
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      component.learningPathData = mockLearningPathData;
    });

    it('should get correct resource icons', () => {
      expect(component.getResourceIcon('video')).toBe('🎥');
      expect(component.getResourceIcon('article')).toBe('📖');
      expect(component.getResourceIcon('course')).toBe('🎓');
      expect(component.getResourceIcon('documentation')).toBe('📚');
      expect(component.getResourceIcon('tutorial')).toBe('💻');
      expect(component.getResourceIcon('unknown')).toBe('🔗');
    });

    it('should get correct duration label', () => {
      expect(component.getDurationLabel()).toBe('Medium Term (1-3 months)');

      component.learningPathData!.duration = 'short-term';
      expect(component.getDurationLabel()).toBe('Short Term (1-4 weeks)');

      component.learningPathData!.duration = 'long-term';
      expect(component.getDurationLabel()).toBe('Long Term (3+ months)');
    });

    it('should calculate total estimated hours', () => {
      expect(component.getTotalEstimatedHours()).toBe(18); // 4 + 8 + 6
    });

    it('should verify mock data structure for completed hours test', () => {
      // Verify that our mock data has the expected structure
      expect(
        component.learningPathData?.learningPath[0].tasks[1].completed
      ).toBe(true);
      expect(
        component.learningPathData?.learningPath[0].tasks[1].estimatedHours
      ).toBe(8);

      // Verify other tasks are not completed
      expect(
        component.learningPathData?.learningPath[0].tasks[0].completed
      ).toBe(false);
      expect(
        component.learningPathData?.learningPath[1].tasks[0].completed
      ).toBe(false);

      // Now test the calculation
      expect(component.getCompletedHours()).toBe(8);
    });

    it('should get total tasks count', () => {
      expect(component.getTotalTasksCount()).toBe(3);
    });

    it('should return 0 for calculations when learningPathData is null', () => {
      component.learningPathData = null;

      expect(component.getTotalEstimatedHours()).toBe(0);
      expect(component.getCompletedHours()).toBe(0);
      expect(component.getTotalTasksCount()).toBe(0);
      expect(component.getCompletedTasksCount()).toBe(0);
      expect(component.getDurationLabel()).toBe('');
    });

    it('should calculate with static data correctly', () => {
      component.learningPathData = component['staticLearningPath'];

      // Static data has 4 periods with 4 + 4 + 4 + 4 = 16 tasks total
      expect(component.getTotalTasksCount()).toBe(16);

      // No tasks completed initially in static data
      expect(component.getCompletedTasksCount()).toBe(0);
      expect(component.getCompletedHours()).toBe(0);

      // Total hours: 23 + 23 + 30 + 30 = 106 hours
      expect(component.getTotalEstimatedHours()).toBe(106);
    });

    it('should calculate completed hours with static data when some tasks are completed', () => {
      component.learningPathData = component['staticLearningPath'];

      // Mark first task of first period as completed (4 hours)
      component.learningPathData.learningPath[0].tasks[0].completed = true;
      // Mark first task of second period as completed (3 hours)
      component.learningPathData.learningPath[1].tasks[0].completed = true;

      expect(component.getCompletedHours()).toBe(7); // 4 + 3 = 7 hours
      expect(component.getCompletedTasksCount()).toBe(2);
    });
  });
});
