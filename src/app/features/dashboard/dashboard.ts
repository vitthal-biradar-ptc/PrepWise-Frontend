import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../core/layout/header/header';
import { AuthService } from '../../services/authorization.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  user: any = null;
  sidebarOpen = false;

  stats = [
    { label: 'Resume Analysis', value: '3', icon: 'document', color: 'from-[#7F00FF] to-[#C400FF]' },
    { label: 'Mock Interviews', value: '7', icon: 'microphone', color: 'from-[#C400FF] to-[#FF6E9F]' },
    { label: 'Learning Paths', value: '2', icon: 'book', color: 'from-[#FF6E9F] to-[#FFB366]' },
    { label: 'Skills Improved', value: '12', icon: 'chart', color: 'from-[#FFB366] to-[#7F00FF]' }
  ];

  recentActivities = [
    { type: 'resume', title: 'Resume Analysis Completed', time: '2 hours ago', status: 'completed' },
    { type: 'interview', title: 'Mock Interview - Frontend Developer', time: '1 day ago', status: 'completed' },
    { type: 'learning', title: 'JavaScript Fundamentals Course', time: '3 days ago', status: 'in-progress' },
    { type: 'interview', title: 'Mock Interview - React Developer', time: '1 week ago', status: 'completed' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get user information from auth service
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'resume': return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'interview': return 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z';
      case 'learning': return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in-progress': return 'text-yellow-400';
      case 'pending': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }
}
