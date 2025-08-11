import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeroComponent } from "../components/hero/hero.component";
import { FeaturesComponent } from "../components/feature-section/features";
import { WorksComponent } from "../components/works/works";
import { TestimonialsComponent } from "../components/testimonials/testimonials";
import { FooterComponent } from '../../../core/layout/footer/footer';
import { HeaderComponent } from '../../../core/layout/header/header';
import { AuthService } from '../../../services/authorization.service';
import { AuthStateService } from '../../../services/auth-state.service';
import { Subscription } from 'rxjs';

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
