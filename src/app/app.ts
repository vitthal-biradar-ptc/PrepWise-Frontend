import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root application component. Hosts the router outlet and app-wide styles.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  /** Reactive application title used where needed across the app. */
  protected readonly title = signal('prepwise-frontend');
}
