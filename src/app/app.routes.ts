import { Routes } from '@angular/router';
import { SignUp } from './features/auth/sign-up/sign-up'; // Correct import path for SignUp
import { SignIn } from './features/auth/sign-in/sign-in';
import { LandingPageComponent } from './features/landing/home/home';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, pathMatch: 'full' }, // Default route
  { path: 'sign-up', component: SignUp },                           // Sign-up route
  { path: 'sign-in', component: SignIn },                           // Sign-in route

];