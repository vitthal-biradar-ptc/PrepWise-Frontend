import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from "./shared/toast/toast.component";

/**
 * Root application component. Hosts the router outlet and app-wide styles.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
})
export class App {
  /** Reactive application title used where needed across the app. */
  protected readonly title = signal('prepwise-frontend');
}
