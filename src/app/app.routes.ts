import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/mock-interview',
    pathMatch: 'full'
  },
  {
    path: 'mock-interview',
    loadComponent: () =>
      import('./features/mock-interview/mock-interview').then(m => m.MockInterview),
  },
  {
    path: '**',
    redirectTo: '/mock-interview'
  }
];