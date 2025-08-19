import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { HeaderComponent } from '../../../core/layout/header/header';
import { LearningPathService } from '../services/learning-path.service';

interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'documentation' | 'tutorial';
}

interface Task {
  id: string;
  description: string;
  completed: boolean;
  estimatedHours: number;
}

interface Period {
  period: string;
  goal: string;
  focusAreas: string[];
  resources: Resource[];
  tasks: Task[];
}

interface LearningPath {
  duration: 'short-term' | 'medium-term' | 'long-term';
  learningPath: Period[];
}

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, HttpClientModule],
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.css']
})
export class LearningPathComponent implements OnInit {
  learningPathData: LearningPath | null = null;
  expandedPeriods: Set<number> = new Set();
  overallProgress = 0;
  periodProgress: number[] = [];
  
  // Static JSON data for fallback
  private staticLearningPath: LearningPath = {
    duration: 'medium-term',
    learningPath: [
      {
        period: 'Week 1-2',
        goal: 'Master JavaScript Fundamentals',
        focusAreas: [
          'ES6+ Features and Syntax',
          'Async/Await and Promises',
          'DOM Manipulation',
          'Event Handling'
        ],
        resources: [
          {
            title: 'JavaScript ES6+ Complete Course',
            url: 'https://www.udemy.com/course/javascript-es6',
            type: 'course'
          },
          {
            title: 'MDN JavaScript Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
            type: 'documentation'
          },
          {
            title: 'JavaScript Promises Explained',
            url: 'https://www.youtube.com/watch?v=DHvZLI7Db8E',
            type: 'video'
          }
        ],
        tasks: [
          {
            id: 'task-1-1',
            description: 'Complete ES6 arrow functions and template literals exercises',
            completed: false,
            estimatedHours: 4
          },
          {
            id: 'task-1-2',
            description: 'Build a simple todo app using vanilla JavaScript',
            completed: false,
            estimatedHours: 8
          },
          {
            id: 'task-1-3',
            description: 'Practice async/await with API calls',
            completed: false,
            estimatedHours: 6
          },
          {
            id: 'task-1-4',
            description: 'Complete DOM manipulation challenges',
            completed: false,
            estimatedHours: 5
          }
        ]
      },
      {
        period: 'Week 3-4',
        goal: 'Learn React Fundamentals',
        focusAreas: [
          'Components and JSX',
          'State and Props Management',
          'Event Handling in React',
          'React Hooks (useState, useEffect)'
        ],
        resources: [
          {
            title: 'Official React Tutorial',
            url: 'https://react.dev/learn',
            type: 'tutorial'
          },
          {
            title: 'React Hooks Complete Guide',
            url: 'https://www.freecodecamp.org/news/react-hooks-complete-guide',
            type: 'article'
          },
          {
            title: 'React Crash Course 2024',
            url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
            type: 'video'
          }
        ],
        tasks: [
          {
            id: 'task-2-1',
            description: 'Create your first React component',
            completed: false,
            estimatedHours: 3
          },
          {
            id: 'task-2-2',
            description: 'Build a counter app with useState',
            completed: false,
            estimatedHours: 4
          },
          {
            id: 'task-2-3',
            description: 'Implement useEffect for data fetching',
            completed: false,
            estimatedHours: 6
          },
          {
            id: 'task-2-4',
            description: 'Create a weather app with API integration',
            completed: false,
            estimatedHours: 10
          }
        ]
      },
      {
        period: 'Week 5-6',
        goal: 'Advanced React Concepts',
        focusAreas: [
          'Component Lifecycle',
          'Context API',
          'Custom Hooks',
          'Performance Optimization'
        ],
        resources: [
          {
            title: 'Advanced React Patterns',
            url: 'https://kentcdodds.com/blog/advanced-react-patterns',
            type: 'article'
          },
          {
            title: 'React Context API Deep Dive',
            url: 'https://www.youtube.com/watch?v=35lXWvCuM8o',
            type: 'video'
          },
          {
            title: 'Custom Hooks Workshop',
            url: 'https://epicreact.dev/custom-hooks',
            type: 'course'
          }
        ],
        tasks: [
          {
            id: 'task-3-1',
            description: 'Implement global state with Context API',
            completed: false,
            estimatedHours: 6
          },
          {
            id: 'task-3-2',
            description: 'Create 3 custom hooks for different use cases',
            completed: false,
            estimatedHours: 8
          },
          {
            id: 'task-3-3',
            description: 'Optimize app performance with React.memo',
            completed: false,
            estimatedHours: 4
          },
          {
            id: 'task-3-4',
            description: 'Build a complete task management app',
            completed: false,
            estimatedHours: 12
          }
        ]
      },
      {
        period: 'Week 7-8',
        goal: 'Full-Stack Integration',
        focusAreas: [
          'REST API Integration',
          'State Management with Redux',
          'Authentication Implementation',
          'Testing with Jest and React Testing Library'
        ],
        resources: [
          {
            title: 'Redux Toolkit Official Guide',
            url: 'https://redux-toolkit.js.org/tutorials/overview',
            type: 'documentation'
          },
          {
            title: 'React Testing Library Course',
            url: 'https://testingjavascript.com',
            type: 'course'
          },
          {
            title: 'JWT Authentication in React',
            url: 'https://www.youtube.com/watch?v=7Q17ubqLfaM',
            type: 'video'
          }
        ],
        tasks: [
          {
            id: 'task-4-1',
            description: 'Set up Redux store and implement basic actions',
            completed: false,
            estimatedHours: 6
          },
          {
            id: 'task-4-2',
            description: 'Implement JWT authentication flow',
            completed: false,
            estimatedHours: 8
          },
          {
            id: 'task-4-3',
            description: 'Write unit tests for components and hooks',
            completed: false,
            estimatedHours: 10
          },
          {
            id: 'task-4-4',
            description: 'Deploy full-stack application',
            completed: false,
            estimatedHours: 6
          }
        ]
      }
    ]
  };

  private userId = '';
  private pathId = '';

  // Modal + generation state
  showGeneratorModal = false;
  newSkill = '';
  newLevel = '';
  generationLoading = false;
  generationError = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private lpService: LearningPathService
  ) {}

  ngOnInit(): void {
    // Load by route params, fallback to static on error
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('user_id') || '';
      this.pathId = params.get('path_id') || '';
      if (!this.userId || !this.pathId) {
        this.learningPathData = this.staticLearningPath;
        this.loadCompletionState();
        this.calculateProgress();
        return;
      }

      this.lpService.getUserLearningPaths(this.userId).subscribe({
        next: (arr) => {
          const match = Array.isArray(arr) ? arr.find((it: any) => String(it.id) === String(this.pathId)) : null;
          if (match) {
            this.learningPathData = this.lpService.mapToUiModel(match) as LearningPath;
          } else {
            this.learningPathData = this.staticLearningPath;
          }
          this.loadCompletionState();
          this.calculateProgress();
        },
        error: () => {
          this.learningPathData = this.staticLearningPath;
          this.loadCompletionState();
          this.calculateProgress();
        }
      });
    });
  }

  // Open/close modal
  openGeneratorModal(): void {
    this.generationError = '';
    this.newSkill = '';
    this.newLevel = '';
    this.showGeneratorModal = true;
  }

  closeGeneratorModal(): void {
    if (this.generationLoading) return;
    this.showGeneratorModal = false;
  }

  // Generate new path and display it
  generateNewPath(): void {
    if (!this.userId) {
      this.generationError = 'Missing userId.';
      return;
    }
    const skill = this.newSkill.trim();
    const level = this.newLevel.trim();
    if (!skill || !level) return;

    const userIdValue = /^\d+$/.test(this.userId) ? Number(this.userId) : this.userId;

    this.generationLoading = true;
    this.generationError = '';

    this.lpService.generateLearningPath({ skill, level, userId: userIdValue })
      .pipe(finalize(() => { this.generationLoading = false; }))
      .subscribe({
        next: (res) => {
          // Map API response to UI model and show it
          this.learningPathData = this.lpService.mapToUiModel(res) as any;
          this.loadCompletionState();
          this.calculateProgress();
          this.showGeneratorModal = false;
          this.newSkill = '';
          this.newLevel = '';
        },
        error: (err) => {
          this.generationError = err?.error?.message || err?.message || 'Failed to generate learning path.';
        }
      });
  }

  private loadCompletionState(): void {
    if (!this.learningPathData || !isPlatformBrowser(this.platformId)) return;
    
    const savedState = localStorage.getItem('learning-path-progress');
    if (savedState) {
      try {
        const completedTasks: Set<string> = new Set(JSON.parse(savedState));
        
        this.learningPathData.learningPath.forEach(period => {
          period.tasks.forEach(task => {
            task.completed = completedTasks.has(task.id);
          });
        });
      } catch (error) {
        console.error('Error loading completion state:', error);
      }
    }
  }

  private saveCompletionState(): void {
    if (!this.learningPathData || !isPlatformBrowser(this.platformId)) return;
    
    const completedTasks: string[] = [];
    this.learningPathData.learningPath.forEach(period => {
      period.tasks.forEach(task => {
        if (task.completed) {
          completedTasks.push(task.id);
        }
      });
    });
    
    localStorage.setItem('learning-path-progress', JSON.stringify(completedTasks));
  }

  togglePeriod(index: number): void {
    if (this.expandedPeriods.has(index)) {
      this.expandedPeriods.delete(index);
    } else {
      this.expandedPeriods.add(index);
    }
  }

  isPeriodExpanded(index: number): boolean {
    return this.expandedPeriods.has(index);
  }

  toggleTask(periodIndex: number, taskIndex: number): void {
    if (!this.learningPathData) return;
    
    const task = this.learningPathData.learningPath[periodIndex].tasks[taskIndex];
    task.completed = !task.completed;
    
    this.saveCompletionState();
    this.calculateProgress();
  }

  private calculateProgress(): void {
    if (!this.learningPathData) return;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    this.periodProgress = this.learningPathData.learningPath.map(period => {
      const periodTotal = period.tasks.length;
      const periodCompleted = period.tasks.filter(task => task.completed).length;
      
      totalTasks += periodTotal;
      completedTasks += periodCompleted;
      
      return periodTotal > 0 ? (periodCompleted / periodTotal) * 100 : 0;
    });
    
    this.overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }

  getResourceIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'video': '🎥',
      'article': '📖',
      'course': '🎓',
      'documentation': '📚',
      'tutorial': '💻'
    };
    return icons[type] || '🔗';
  }

  getDurationLabel(): string {
    if (!this.learningPathData) return '';
    
    const labels: { [key: string]: string } = {
      'short-term': 'Short Term (1-4 weeks)',
      'medium-term': 'Medium Term (1-3 months)', 
      'long-term': 'Long Term (3+ months)'
    };
    return labels[this.learningPathData.duration] || '';
  }

  getTotalEstimatedHours(): number {
    if (!this.learningPathData) return 0;
    
    return this.learningPathData.learningPath.reduce((total, period) => {
      return total + period.tasks.reduce((periodTotal, task) => {
        return periodTotal + task.estimatedHours;
      }, 0);
    }, 0);
  }

  getCompletedHours(): number {
    if (!this.learningPathData) return 0;
    
    return this.learningPathData.learningPath.reduce((total, period) => {
      return total + period.tasks.reduce((periodTotal, task) => {
        return periodTotal + (task.completed ? task.estimatedHours : 0);
      }, 0);
    }, 0);
  }

  getTotalTasksCount(): number {
    if (!this.learningPathData) return 0;
    
    return this.learningPathData.learningPath.reduce((total, period) => {
      return total + period.tasks.length;
    }, 0);
  }

  getCompletedTasksCount(): number {
    if (!this.learningPathData) return 0;
    
    return this.learningPathData.learningPath.reduce((total, period) => {
      return total + period.tasks.filter(task => task.completed).length;
    }, 0);
  }
}
