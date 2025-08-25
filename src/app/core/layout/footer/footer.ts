import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  navigationLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' }
  ];

  features = [
    { name: 'Resume Analysis', href: '/resume-analyzer' },
    { name: 'Mock Interviews', href: '/mock-interview' },
    { name: 'Learning Paths', href: '/learning-paths' },
    { name: 'Profile Builder', href: '/parse-resume' },
    { name: 'Progress Tracking', href: '/dashboard' }
  ];

  resources = [
    { name: 'Interview Tips', href: '#' },
    { name: 'Career Guide', href: '#' },
    { name: 'Resume Templates', href: '#' },
    { name: 'Industry Insights', href: '#' },
    { name: 'Success Stories', href: '#' }
  ];

  companyLinks = [
    { name: 'About Us', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Help Center', href: '#' }
  ];

  legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'Disclaimer', href: '#' }
  ];
}
