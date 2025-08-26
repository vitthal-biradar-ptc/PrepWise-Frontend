import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/authorization.service';
import { AuthStateService } from '../../../services/auth-state.service';
import { Subscription } from 'rxjs';
import { UserProfileService } from '../../../services/user-profile.service';

/**
 * Navigation item for header links.
 */
interface NavItem {
  title: string;
  href: string;
  icon: string;
}

/**
 * App header with navigation, auth state display, and profile controls.
 *
 * - Reacts to scroll to adjust visual style
 * - Shows different actions based on authentication state
 * - Manages mobile menu and profile dropdown interactions
 */
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
  private userIdSubscription?: Subscription;
  userId: string | null = null;
  
  navItems: NavItem[] = [
    { title: 'Features', href: '/', icon: 'layout' },
    { title: 'Interviews', href: '/mock-interview', icon: 'interviews' },
    { title: 'Resume Analyzer', href: '/resume-analyzer', icon: 'book' },
    { title: 'How It Works', href: '/', icon: 'help' }
  ];

  constructor(
    private router: Router, 
    private authService: AuthService,
    private authStateService: AuthStateService,
    private profileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.isAuthLoading = true;

    this.authSubscription = this.authStateService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        this.isAuthLoading = false;
        // Ensure menus reflect auth status changes
        if (!isAuth) {
          this.profileDropdownOpen = false;
          this.userId = null;
        } else if (!this.userId) {
          // Fetch once and cache in memory (no localStorage)
          this.userIdSubscription?.unsubscribe();
          this.userIdSubscription = this.profileService.getUserIdCached().subscribe(id => {
            this.userId = id;
          });
        }
      }
    );

    // Seed initial auth state; triggers subscription above
    this.isAuthenticated = this.authStateService.isAuthenticated();

    setTimeout(() => {
      this.isAuthLoading = false;
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userIdSubscription) {
      this.userIdSubscription.unsubscribe();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
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
    if (this.mobileMenuOpen) {
      this.profileDropdownOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    if (this.profileDropdownOpen) {
      this.mobileMenuOpen = false;
    }
  }

  closeProfileDropdown(): void {
    this.profileDropdownOpen = false;
  }

  navigateToSection(href: string): void {
    this.closeMobileMenu();
    // Smooth scroll to anchor targets on the page
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
    this.router.navigate(['/dashboard/', this.userId]);
    this.closeProfileDropdown();
  }

  logout(): void {
    this.authService.logout();
    this.profileService.clearCache(); // clear in-memory cached profile/id
    this.userId = null;
    this.closeMobileMenu();
    this.closeProfileDropdown();
    // Redirect to home page after logout
    this.router.navigate(['/']);
  }

  handleNavClick(item: NavItem, event: MouseEvent): void {
    event.preventDefault();
    
    if (item.href.startsWith('/')) {
      // Use Angular router for internal routes
      this.router.navigate([item.href]);
      this.closeMobileMenu();
    } else {
      // In-page hash link
      this.navigateToSection(item.href);
    }
  }

  /** Returns cached user id if available (synchronous). */
  getUserId(): string | null {
    return this.userId;
  }
}
