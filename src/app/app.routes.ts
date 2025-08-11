import { Routes } from '@angular/router';

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
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'parse-resume',
    loadComponent: () => import('./features/parse-resume/parse-resume').then(m => m.ParseResume),
  },
  {
    path: 'resume-analyzer',
    loadComponent: () => import('./features/resume-analyzer/resume-analyzer').then(m => m.ResumeAnalyzer)
  },
  {
    path: 'learning-path',
    loadComponent: () => import('./features/learning-path/learning-path.component').then(m => m.LearningPathComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];