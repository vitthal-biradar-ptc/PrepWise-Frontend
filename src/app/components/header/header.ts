import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HeaderComponent implements OnInit {
  mobileMenuOpen = false;
  isScrolled = false;
  
  navItems: NavItem[] = [
    { title: 'Features', href: '#features', icon: 'layout' },
    { title: 'Interviews', href: '#interviews', icon: 'interviews' },
    { title: 'Learning', href: '#learning', icon: 'book' },
    { title: 'How It Works', href: '#how-it-works', icon: 'help' }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  navigateToSection(href: string): void {
    this.closeMobileMenu();
    // Smooth scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}
