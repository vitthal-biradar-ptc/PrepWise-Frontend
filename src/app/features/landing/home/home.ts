import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../../core/layout/footer/footer';
import { HeaderComponent } from '../../../core/layout/header/header';
import { AuthStateService } from '../../../services/auth-state.service';
import { AuthService } from '../../../services/authorization.service';
import { FeaturesComponent } from "../components/feature-section/features";
import { HeroComponent } from "../components/hero/hero.component";
import { TestimonialsComponent } from "../components/testimonials/testimonials";
import { WorksComponent } from "../components/works/works";

@Component({
  selector: 'home',
  standalone: true, 
  imports: [HeroComponent, FeaturesComponent, WorksComponent, TestimonialsComponent, HeaderComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit(): void {
    // Ensure auth state is properly initialized without validation
    this.authSubscription = this.authStateService.isAuthenticated$.subscribe();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
