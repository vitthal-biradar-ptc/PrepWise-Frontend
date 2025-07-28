import { Component } from '@angular/core';
import {  RouterModule,RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, RouterModule]
})
export class AppComponent {
  title = 'PrepWise-Frontend';
}
