import { Routes } from '@angular/router';
import { SignUp } from './sign-up/sign-up'; // Correct import path for SignUp
import { LandingPageComponent } from './landing-page/landing-page';
import { SignIn } from './sign-in/sign-in';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, pathMatch: 'full' }, // Default route
  { path: 'sign-up', component: SignUp },                           // Sign-up route
  { path: 'sign-in', component: SignIn },                           // Sign-in route

];