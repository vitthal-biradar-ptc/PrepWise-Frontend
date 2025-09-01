import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../core/layout/header/header';
import { LearningPathService } from '../services/learning-path.service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../../core/layout/footer/footer';

/** Minimal card data for listing user learning paths. */
type LearningPathItem = {
  id: string | number;
  skill?: string;
  level?: string;
  duration?: 'short-term' | 'medium-term' | 'long-term' | string;
  createdAt?: string;
  userId?: string | number;
  learningPeriods?: any[];
  // augmented for UI
  title?: string;
  description?: string;
};

const getId = (lp: LearningPathItem) => lp.id?.toString() ?? '';
const getTitle = (lp: LearningPathItem) =>
  lp.title ?? lp.skill ?? `Learning Path ${getId(lp)}`;

/**
 * Lists learning paths for a user with generator and delete actions.
 */
@Component({
  selector: 'app-learning-path-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    HeaderComponent,
    FormsModule,
    FooterComponent,
  ],
  templateUrl: './learning-path-list.component.html',
  styleUrls: ['./learning-path-list.component.css'],
})
export class LearningPathsComponent implements OnInit {
  paths: LearningPathItem[] = [];
  loading = false;
  error = '';
  userId = '';

  // Add progress data property
  private progressData: { [pathId: string]: any } = {};

  // Search and filter state
  searchTerm = '';
  selectedCategory = '';
  selectedSort = 'recent';
  availableCategories: string[] = [];

  // Generator form state
  newSkill = '';
  newLevel = '';
  generationLoading = false;
  generationError = '';
  generationSuccess = '';

  // Modal state
  showGeneratorModal = false;

  // Track per-item delete state
  deletingIds = new Set<string>();
  deleteTarget: { id: string; title: string } | null = null;
  deleteError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lpService: LearningPathService
  ) {}

  ngOnInit(): void {
    // Resolve userId from route param :user_id
    this.route.paramMap.subscribe((params) => {
      const routeUserId = params.get('user_id') || '';
      this.userId = routeUserId;
      if (!this.userId) {
        this.error = 'Missing userId in route. Use /learning-paths/:user_id.';
        this.paths = [];
        return;
      }
      this.fetchLearningPaths(this.userId);
    });
  }

  /** Get path-specific localStorage key */
  private getPathStorageKey(pathId: string): string {
    return `learning-path-progress_${this.userId}_${pathId}`;
  }

  /** Load progress data from localStorage and calculate progress for all paths */
  private loadProgressData(): void {
    if (!this.paths.length) return;

    try {
      // Calculate progress for each path using its own localStorage key
      this.progressData = {};
      this.paths.forEach((path) => {
        const pathId = getId(path);
        const pathStorageKey = this.getPathStorageKey(pathId);
        const savedState = localStorage.getItem(pathStorageKey);

        if (
          savedState &&
          path.learningPeriods &&
          Array.isArray(path.learningPeriods)
        ) {
          const completedTaskIds: string[] = JSON.parse(savedState);
          let totalTasks = 0;
          let completedTasks = 0;
          let totalPeriods = path.learningPeriods.length;
          let completedPeriods = 0;

          path.learningPeriods.forEach((period: any) => {
            if (period.tasks && Array.isArray(period.tasks)) {
              const periodTasks = period.tasks.length;
              let periodCompletedTasks = 0;

              period.tasks.forEach((task: any) => {
                totalTasks++;

                const taskId = task.taskId || task.id;
                if (taskId && completedTaskIds.includes(taskId)) {
                  completedTasks++;
                  periodCompletedTasks++;
                }
              });

              // Consider period completed if all tasks are done
              if (periodTasks > 0 && periodCompletedTasks === periodTasks) {
                completedPeriods++;
              }
            }
          });

          const percentage =
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          this.progressData[pathId] = {
            completedTasks,
            totalTasks,
            completedPeriods,
            totalPeriods,
            percentage,
          };
        } else {
          // No progress data for this path
          this.progressData[pathId] = {
            completedTasks: 0,
            totalTasks:
              path.learningPeriods?.reduce((total: number, period: any) => {
                return total + (period.tasks?.length || 0);
              }, 0) || 0,
            completedPeriods: 0,
            totalPeriods: path.learningPeriods?.length || 0,
            percentage: 0,
          };
        }
      });
    } catch (error) {
      console.warn('Failed to load progress data from localStorage:', error);
      this.progressData = {};
    }
  }

  /** Get progress status for filtering */
  getProgressStatus(
    path: LearningPathItem
  ): 'Not Started' | 'In Progress' | 'Completed' {
    const percentage = this.getProgressPercentage(path);

    if (percentage === 0) {
      return 'Not Started';
    } else if (percentage === 100) {
      return 'Completed';
    } else {
      return 'In Progress';
    }
  }
  /** Calculate progress percentage for a learning path */
  getProgressPercentage(path: LearningPathItem): number {
    const pathId = getId(path);

    // First try to get from cached progress data
    const progress = this.progressData[pathId];

    if (progress && typeof progress.percentage === 'number') {
      return Math.round(progress.percentage);
    }

    // Fallback: calculate directly from localStorage if learningPeriods exist
    if (path.learningPeriods && Array.isArray(path.learningPeriods)) {
      try {
        const pathStorageKey = this.getPathStorageKey(pathId);
        const savedState = localStorage.getItem(pathStorageKey);

        if (savedState) {
          const completedTaskIds: string[] = JSON.parse(savedState);
          let totalTasks = 0;
          let completedTasks = 0;

          path.learningPeriods.forEach((period: any) => {
            if (period.tasks && Array.isArray(period.tasks)) {
              period.tasks.forEach((task: any) => {
                totalTasks++;
                const taskId = task.taskId || task.id;

                if (taskId && completedTaskIds.includes(taskId)) {
                  completedTasks++;
                }
              });
            }
          });

          return totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;
        }
      } catch (error) {
        console.warn('Failed to calculate progress from localStorage:', error);
      }
    }

    return 0;
  }

  /** Retrieve learning paths and populate list. */
  fetchLearningPaths(userId: string) {
    this.loading = true;
    this.error = '';
    this.lpService
      .getUserLearningPaths(userId)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (raw) => {
          this.paths = this.lpService.toCardItems(raw) as any[];
          this.updateAvailableCategories();
          // Load progress data after paths are loaded
          this.loadProgressData();
        },
        error: (err) => {
          this.error = err?.message || 'Failed to load learning paths.';
          this.paths = [];
        },
      });
  }

  // Search and Filter Methods
  get filteredPaths(): LearningPathItem[] {
    let filtered = [...this.paths];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (path) =>
          this.getTitle(path).toLowerCase().includes(searchLower) ||
          path.skill?.toLowerCase().includes(searchLower) ||
          path.description?.toLowerCase().includes(searchLower) ||
          path.level?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      if (
        this.selectedCategory === 'Beginner' ||
        this.selectedCategory === 'Intermediate' ||
        this.selectedCategory === 'Advanced'
      ) {
        filtered = filtered.filter(
          (path) => path.level === this.selectedCategory
        );
      } else if (this.selectedCategory === 'In Progress') {
        // Filter for paths with actual progress data
        filtered = filtered.filter(
          (path) => this.getProgressStatus(path) === 'In Progress'
        );
      } else if (this.selectedCategory === 'Completed') {
        // Filter for completed paths with actual progress data
        filtered = filtered.filter(
          (path) => this.getProgressStatus(path) === 'Completed'
        );
      }
    }

    // Apply sorting
    return this.sortPaths(filtered);
  }

  private sortPaths(paths: LearningPathItem[]): LearningPathItem[] {
    const sorted = [...paths];

    switch (this.selectedSort) {
      case 'recent':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || '').getTime();
          const dateB = new Date(b.createdAt || '').getTime();
          return dateB - dateA;
        });

      case 'title-asc':
        return sorted.sort((a, b) =>
          this.getTitle(a).localeCompare(this.getTitle(b))
        );

      case 'title-desc':
        return sorted.sort((a, b) =>
          this.getTitle(b).localeCompare(this.getTitle(a))
        );

      case 'difficulty':
        const difficultyOrder = {
          Beginner: 1,
          Intermediate: 2,
          Advanced: 3,
        };
        return sorted.sort((a, b) => {
          const levelA =
            difficultyOrder[a.level as keyof typeof difficultyOrder] || 0;
          const levelB =
            difficultyOrder[b.level as keyof typeof difficultyOrder] || 0;
          return levelA - levelB;
        });

      case 'duration':
        const durationOrder = {
          'short-term': 1,
          'medium-term': 2,
          'long-term': 3,
        };
        return sorted.sort((a, b) => {
          const durationA =
            durationOrder[a.duration as keyof typeof durationOrder] || 0;
          const durationB =
            durationOrder[b.duration as keyof typeof durationOrder] || 0;
          return durationA - durationB;
        });

      default:
        return sorted;
    }
  }

  private updateAvailableCategories() {
    const categories = new Set<string>();
    categories.add('In Progress');
    categories.add('Completed');

    this.paths.forEach((path) => {
      if (path.level) {
        categories.add(path.level);
      }
    });

    this.availableCategories = Array.from(categories);
  }

  // Search and filter event handlers
  onSearch() {
    // The getter will automatically update the filtered results
  }

  clearSearch() {
    this.searchTerm = '';
  }

  filterByCategory(category: string | null) {
    this.selectedCategory = category || '';
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSort = target.value;
  }

  // Check if search is active for UI state
  get hasActiveFilters(): boolean {
    return !!(this.searchTerm.trim() || this.selectedCategory);
  }

  // Get count of results after filtering
  get filteredCount(): number {
    return this.filteredPaths.length;
  }

  /** Call API to generate new path and refresh list. */
  generateNewPath() {
    if (!this.userId) {
      this.generationError = 'Missing userId in route.';
      return;
    }
    const skill = this.newSkill.trim();
    const level = this.newLevel.trim();
    if (!skill || !level) return;

    this.generationLoading = true;
    this.generationError = '';
    this.generationSuccess = '';

    const userIdValue = /^\d+$/.test(this.userId)
      ? Number(this.userId)
      : this.userId;

    this.lpService
      .generateLearningPath({ skill, level, userId: userIdValue })
      .pipe(
        finalize(() => {
          this.generationLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.generationSuccess = 'Learning path generated successfully.';
          this.newSkill = '';
          this.newLevel = '';
          this.fetchLearningPaths(this.userId);
          this.showGeneratorModal = false; // close modal on success
        },
        error: (err) => {
          this.generationError =
            err?.error?.message ||
            err?.message ||
            'Failed to generate learning path.';
        },
      });
  }

  // Open custom delete confirmation modal
  openDeleteModal(lp: LearningPathItem, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const id = getId(lp);
    if (!id) return;
    this.deleteError = '';
    this.deleteTarget = { id, title: this.getTitle(lp) };
  }

  // Close custom delete confirmation modal
  closeDeleteModal() {
    if (this.deleteTarget && this.deletingIds.has(this.deleteTarget.id)) return;
    this.deleteTarget = null;
    this.deleteError = '';
  }

  /** Confirm deletion via API and update local list. */
  confirmDelete() {
    if (!this.deleteTarget || !this.userId) return;
    const id = this.deleteTarget.id;

    this.deletingIds.add(id);
    this.lpService
      .deleteLearningPath(this.userId, id)
      .pipe(finalize(() => this.deletingIds.delete(id)))
      .subscribe({
        next: () => {
          this.paths = this.paths.filter((p) => getId(p) !== id);
          this.deleteTarget = null;
        },
        error: (err) => {
          this.deleteError =
            err?.error?.message ||
            err?.message ||
            'Failed to delete learning path.';
        },
      });
  }

  // Modal helpers
  openGeneratorModal() {
    this.generationError = '';
    this.generationSuccess = '';
    this.showGeneratorModal = true;
  }

  closeGeneratorModal() {
    if (this.generationLoading) return;
    this.showGeneratorModal = false;
  }

  openPath(lp: LearningPathItem) {
    const id = getId(lp);
    if (!id || !this.userId) return;
    this.router.navigate([
      '/learning-paths/user',
      this.userId,
      'learning-path',
      id,
    ]);
  }

  // Add helper method for duration text
  getDurationText(duration?: string): string {
    switch (duration) {
      case 'short-term':
        return '1-2 weeks';
      case 'medium-term':
        return '1-2 months';
      case 'long-term':
        return '3+ months';
      default:
        return '1-2 months';
    }
  }

  trackById = (_: number, lp: LearningPathItem) => getId(lp);
  getTitle = getTitle;
  getId = getId;

  // Clear all active filters
  clearAllFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedSort = 'recent';
  }
}
