import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule ,RouterLink} from '@angular/router';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrls: ['./hero.css'],
  standalone: true,
  imports: [CommonModule, RouterModule,RouterLink]
})
export class HeroComponent {
}
