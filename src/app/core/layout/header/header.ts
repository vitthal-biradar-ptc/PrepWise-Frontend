import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/authorization.service';
import { Subscription } from 'rxjs';

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
export class HeaderComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  isScrolled = false;
  isAuthenticated = false;
  private authSubscription?: Subscription;
  
  navItems: NavItem[] = [
    { title: 'Features', href: '#features', icon: 'layout' },
    { title: 'Interviews', href: '#interviews', icon: 'interviews' },
    { title: 'Learning', href: '#learning', icon: 'book' },
    { title: 'How It Works', href: '#how-it-works', icon: 'help' }
  ];

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
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

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}
