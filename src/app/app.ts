import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Hero } from './components/hero/hero';
import { HeaderComponent } from './components/header/header';
import { Features } from './components/features/features';
import { Works } from './components/works/works';
import { Testimonials } from './components/testimonials/testimonials';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Hero, HeaderComponent, Features, Works, Testimonials, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('PrepWise');
}
