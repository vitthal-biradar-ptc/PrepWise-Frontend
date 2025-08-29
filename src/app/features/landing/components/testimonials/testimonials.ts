import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Testimonials section with simple star rating rendering.
 */
@Component({
  selector: 'app-testimonials',
  imports: [CommonModule],
  templateUrl: './testimonials.html',
  styleUrls: ['./testimonials.css'],
})
export class TestimonialsComponent {
  testimonials = [
    {
      name: 'James Smith',
      role: 'Software Engineer',
      initials: 'JS',
      rating: 5,
      content:
        'The resume builder helped me tailor my application perfectly. I received 3 interview calls in the first week after updating my resume!',
    },
    {
      name: 'Amanda Rodriguez',
      role: 'Marketing Specialist',
      initials: 'AR',
      rating: 5,
      content:
        'I was struggling with my resume format until I found this tool. The job description analyzer is a game-changer for targeting specific roles.',
    },
    {
      name: 'David Nguyen',
      role: 'Product Manager',
      initials: 'DN',
      rating: 5,
      content:
        'The templates are clean and professional. I particularly liked how easy it was to highlight my achievements with the suggested formatting.',
    },
  ];

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
