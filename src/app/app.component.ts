import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Hero } from "./components/hero/hero";
import { HeaderComponent } from "./components/header/header";
import { Features } from "./components/features/features";
import { Works } from "./components/works/works";
import { Testimonials } from "./components/testimonials/testimonials";
import { Footer } from "./components/footer/footer";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, Hero, HeaderComponent, Features, Works, Testimonials, Footer]
})
export class AppComponent {
  title = 'PrepWise-Frontend';
}
