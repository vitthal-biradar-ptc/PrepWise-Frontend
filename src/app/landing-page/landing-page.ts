import { Component } from '@angular/core';
import { HeroComponent } from "../components/hero/hero.component";
import { FeaturesComponent } from "../components/features/features";
import { WorksComponent } from "../components/works/works";
import { TestimonialsComponent } from "../components/testimonials/testimonials";
import { HeaderComponent } from "../components/header/header";
import { Footer } from "../components/footer/footer";

@Component({
  selector: 'app-landing-page',
  standalone: true, 
  imports: [HeroComponent, FeaturesComponent, WorksComponent, TestimonialsComponent, HeaderComponent, Footer],
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPageComponent  {

}
