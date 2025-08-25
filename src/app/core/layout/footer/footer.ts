import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * App footer with navigation groups and legal links.
 */
@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  /** Primary navigation shortcuts to sections on the landing page. */
  navigationLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' }
  ];

  /** Key product features available in the application. */
  features = [
    { name: 'Resume Analysis', href: '/resume-analyzer' },
    { name: 'Mock Interviews', href: '/mock-interview' },
    { name: 'Learning Paths', href: '/learning-paths' },
    { name: 'Profile Builder', href: '/parse-resume' },
    { name: 'Progress Tracking', href: '/dashboard' }
  ];

  /** Helpful resources (static links or future content). */
  resources = [
    { name: 'Interview Tips', href: '#' },
    { name: 'Career Guide', href: '#' },
    { name: 'Resume Templates', href: '#' },
    { name: 'Industry Insights', href: '#' },
    { name: 'Success Stories', href: '#' }
  ];

  /** Company-related pages. */
  companyLinks = [
    { name: 'About Us', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Help Center', href: '#' }
  ];

  /** Legal and policy links. */
  legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'Disclaimer', href: '#' }
  ];
}
