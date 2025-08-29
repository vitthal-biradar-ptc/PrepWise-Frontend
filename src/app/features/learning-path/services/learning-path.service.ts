import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/authorization.service';

/** Backend resource model. */
export interface ApiResource {
  id: number;
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'documentation' | 'tutorial' | string;
}

/** Backend task model. */
export interface ApiTask {
  id: number;
  taskId?: string;
  description: string;
  completed: boolean;
  estimatedHours: number;
}

/** Backend period model. */
export interface ApiPeriod {
  id: number;
  period: string;
  goal: string;
  focusAreas: string | string[];
  resources: ApiResource[];
  tasks: ApiTask[];
}

/** Backend learning path model. */
export interface ApiLearningPath {
  id: number | string;
  skill?: string;
  level?: string;
  duration?: 'short-term' | 'medium-term' | 'long-term' | string;
  createdAt?: string;
  userId?: number | string;
  learningPeriods?: ApiPeriod[];
}

/**
 * Service for fetching, generating and mapping learning paths.
 */
@Injectable({ providedIn: 'root' })
export class LearningPathService {
  private readonly API_BASE = environment.apiUrl;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {}

  /** Fetch all learning paths belonging to a user. */
  getUserLearningPaths(userId: string): Observable<ApiLearningPath[]> {
    return this.http
      .get<ApiLearningPath[] | { items: ApiLearningPath[] }>(
        `${this.API_BASE}/api/learning-path/user/${encodeURIComponent(userId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${this.authService.getToken()}`,
          },
        }
      )
      .pipe(
        map(
          (res: any) =>
            (Array.isArray(res) ? res : res?.items ?? []) as ApiLearningPath[]
        )
      );
  }

  /** Convert raw API items into card list items. */
  toCardItems(items: ApiLearningPath[]) {
    return items.map((it) => {
      const created = it.createdAt ? new Date(it.createdAt) : null;
      const title = `${it.skill ?? 'Learning Path'}${
        it.level ? ` (${it.level})` : ''
      }`;
      const descParts = [
        it.level ? `Level: ${it.level}` : '',
        it.duration ? `Duration: ${it.duration}` : '',
        created ? `Created: ${created.toLocaleDateString()}` : '',
      ].filter(Boolean);
      return {
        ...it,
        title,
        description: descParts.join(' • '),
      };
    });
  }

  /** Map backend representation to the UI learning path shape. */
  mapToUiModel(api: ApiLearningPath) {
    const parseFocusAreas = (input: any): string[] => {
      if (Array.isArray(input)) return input;
      if (typeof input === 'string') {
        try {
          const parsed = JSON.parse(input);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore
        }
        return input
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    return {
      duration: api.duration || 'medium-term',
      learningPath: (api.learningPeriods || []).map((p) => ({
        period: p.period,
        goal: p.goal,
        focusAreas: parseFocusAreas(p.focusAreas),
        resources: (p.resources || []).map((r) => ({
          title: r.title,
          url: r.url,
          type: r.type,
        })),
        tasks: (p.tasks || []).map((t) => ({
          id: t.taskId || String(t.id ?? ''),
          description: t.description,
          completed: !!t.completed,
          estimatedHours: Number.isFinite(t.estimatedHours)
            ? t.estimatedHours
            : 0,
        })),
      })),
    };
  }

  /** Generate a new learning path for a user and skill/level. */
  generateLearningPath(payload: {
    skill: string;
    level: string;
    userId: number | string;
  }): Observable<ApiLearningPath> {
    return this.http.post<ApiLearningPath>(
      `${this.API_BASE}/api/learning-path/generate`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${this.authService.getToken()}`,
        },
      }
    );
  }

  /** Delete a learning path by user and path id. */
  deleteLearningPath(
    userId: string | number,
    pathId: string | number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.API_BASE}/api/learning-path/delete/${encodeURIComponent(
        String(userId)
      )}/${encodeURIComponent(String(pathId))}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${this.authService.getToken()}`,
        },
      }
    );
  }
}
