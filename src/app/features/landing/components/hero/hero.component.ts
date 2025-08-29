import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrls: ['./hero.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class HeroComponent {
  isAuthenticated: any;
}
