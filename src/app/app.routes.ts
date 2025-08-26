import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

/**
 * Application route definitions.
 *
 * Components are lazy-loaded for better initial load time.
 * Protected routes require authentication via `AuthGuard`.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/home/home').then(m => m.LandingPageComponent),
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./features/auth/sign-up/sign-up').then(m => m.SignUp),
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./features/auth/sign-in/sign-in').then(m => m.SignIn),
  },
  {
    path: 'dashboard/:user_id',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'parse-resume',
    loadComponent: () => import('./features/parse-resume/parse-resume').then(m => m.ParseResume),
    canActivate: [AuthGuard]
  },
  {
    path: 'resume-analyzer',
    loadComponent: () => import('./features/resume-analyzer/resume-analyzer').then(m => m.ResumeAnalyzer),
    canActivate: [AuthGuard]
  },
  {
    path: 'learning-paths/:user_id',
    loadComponent: () => import('./features/learning-path/learning-paths.component').then(m => m.LearningPathsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'learning-path/:user_id/:path_id',
    loadComponent: () => import('./features/learning-path/learning-path.component').then(m => m.LearningPathComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'mock-interview',
    loadComponent: () => import('./features/mock-interview/mock-interview').then(m => m.MockInterview),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '',
  },
];