import { Component } from '@angular/core';
import { HeroComponent } from "../components/hero/hero.component";
import { FeaturesComponent } from "../components/feature-section/features";
import { WorksComponent } from "../components/works/works";
import { TestimonialsComponent } from "../components/testimonials/testimonials";
import { FooterComponent } from '../../../core/layout/footer/footer';
import { HeaderComponent } from '../../../core/layout/header/header';

@Component({
  selector: 'app-landing-page',
  standalone: true, 
  imports: [HeroComponent, FeaturesComponent, WorksComponent, TestimonialsComponent, HeaderComponent, FooterComponent],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPageComponent  {

}
