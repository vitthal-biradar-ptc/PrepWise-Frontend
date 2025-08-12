import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/authorization.service';
import { AuthStateService } from '../../../services/auth-state.service';
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
  isAuthLoading = true;
  profileDropdownOpen = false;
  private authSubscription?: Subscription;
  
  navItems: NavItem[] = [
    { title: 'Features', href: '/', icon: 'layout' },
    { title: 'Interviews', href: '/mock-interview', icon: 'interviews' },
    { title: 'Resume Analyzer', href: '/resume-analyzer', icon: 'book' },
    { title: 'How It Works', href: '/', icon: 'help' }
  ];

  constructor(
    private router: Router, 
    private authService: AuthService,
    private authStateService: AuthStateService
  ) { }

  ngOnInit(): void {
    // Start with loading state
    this.isAuthLoading = true;
    
    // Subscribe to auth state changes first
    this.authSubscription = this.authStateService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        this.isAuthLoading = false;
        // Close dropdowns when auth state changes
        if (!isAuth) {
          this.profileDropdownOpen = false;
        }
      }
    );

    // Initialize auth state - this will trigger the subscription above
    this.isAuthenticated = this.authStateService.isAuthenticated();
    
    // Set loading to false after a brief delay to ensure proper state initialization
    setTimeout(() => {
      this.isAuthLoading = false;
    }, 100);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown when clicking outside
    if (this.profileDropdownOpen) {
      const target = event.target as HTMLElement;
      const profileButton = target.closest('.profile-button');
      const dropdown = target.closest('.profile-dropdown');
      
      if (!profileButton && !dropdown) {
        this.profileDropdownOpen = false;
      }
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    // Close profile dropdown when opening mobile menu
    if (this.mobileMenuOpen) {
      this.profileDropdownOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    // Close mobile menu when opening profile dropdown
    if (this.profileDropdownOpen) {
      this.mobileMenuOpen = false;
    }
  }

  closeProfileDropdown(): void {
    this.profileDropdownOpen = false;
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

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.closeProfileDropdown();
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
    this.closeProfileDropdown();
    // Redirect to home page after logout
    this.router.navigate(['/']);
  }

  handleNavClick(item: NavItem, event: MouseEvent): void {
    event.preventDefault();
    
    if (item.href.startsWith('/')) {
      // Internal route - use Angular router
      this.router.navigate([item.href]);
      this.closeMobileMenu();
    } else {
      // Internal hash link - use existing scroll behavior
      this.navigateToSection(item.href);
    }
  }
}
