import { Routes } from '@angular/router';
import { SignUp } from './features/auth/sign-up/sign-up';
import { SignIn } from './features/auth/sign-in/sign-in';
import { LandingPageComponent } from './features/landing/home/home';
import { ResumeAnalyzer } from './features/resume-analyzer/resume-analyzer';
import { DashboardComponent } from './features/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, pathMatch: 'full' }, // Default route
  { path: 'sign-up', component: SignUp },                           // Sign-up route
  { path: 'sign-in', component: SignIn },                           // Sign-in route
  { path: 'resume-analyzer', component: ResumeAnalyzer },           // Resume Analyzer route
  { path: 'dashboard', component: DashboardComponent },             // Dashboard route
];