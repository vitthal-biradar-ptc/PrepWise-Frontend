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
        },
        error: (err) => {
          this.error = err?.message || 'Failed to load learning paths.';
          this.paths = [];
        },
      });
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

  trackById = (_: number, lp: LearningPathItem) => getId(lp);
  getTitle = getTitle;
  getId = getId;
}
