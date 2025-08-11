import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserProfileService } from '../../services/user-profile.service';
import { UserProfile, BackendSkill, BackendCertification, BackendAchievement, UpdateProfilePayload } from './user-profile.interface';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { HeaderComponent } from "../../core/layout/header/header";

interface Skill {
  id: number;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: string;
}

interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  description: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ChartModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ChipModule,
    AvatarModule,
    BadgeModule,
    TextareaModule,
    DialogModule,
    ToastModule,
    HeaderComponent
],
  providers: [MessageService, UserProfileService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // Profile data - will be populated from backend
  profile = {
    name: '',
    email: '',
    location: '',
    domain: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    photo: ''
  };

  // Chart data
  domainChartData: any;
  domainChartOptions: any;
  atsChartData: any;
  atsChartOptions: any;

  // Data arrays - will be populated from backend
  skills: Skill[] = [];
  certifications: Certification[] = [];
  achievements: Achievement[] = [];

  // New item placeholders
  newSkill: Partial<Skill> = {};
  newCertification: Partial<Certification> = {};
  newAchievement: Partial<Achievement> = {};

  // Edit modes
  isProfileEditing = false;
  showAddSkillDialog = false;
  showAddCertificationDialog = false;
  showAddAchievementDialog = false;

  // Add property to store resume analysis result
  resumeAnalysisResult: any = null;
  showAnalysisNotification: boolean = false;

  // Add property to track if data has been modified
  private isDataModified = false;

  constructor(
    private messageService: MessageService,
    private userProfileService: UserProfileService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    // Initialize charts first
    this.initPerformanceChart();
    this.initCharts(); // Initialize with fallback data

    // Check for resume analysis result
    this.checkForResumeAnalysisResult();

    // Then load user profile
    this.loadUserProfile();
  }

  checkForResumeAnalysisResult() {
    try {
      // Use the new toast service
      this.toastService.showSuccess(
        'Resume Analysis Complete!',
        "",
        5000
      );

    } catch (error) {
      console.error('Error parsing resume analysis result:', error);
      sessionStorage.removeItem('resumeAnalysisResult');
      this.toastService.showError(
        'Data Error',
        'Failed to load resume analysis results.',
        4000
      );
    }

  }

  loadUserProfile() {
    this.userProfileService.getUserProfile().subscribe({
      next: (data: UserProfile) => {
        this.populateProfileData(data);
        this.populateSkillsData(data.skills || []);
        this.populateCertificationsData(data.certifications || []);
        this.populateAchievementsData(data.achievements || []);
        this.initDomainChart(data.domainData);

        this.toastService.showSuccess(
          'Profile Loaded',
          'Your profile data has been loaded successfully.',
          3000
        );

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastService.showError(
          'Profile Load Failed',
          'Failed to load profile data. Using fallback data.',
          5000
        );
        this.cdr.detectChanges();
      }
    });
  }

  private populateProfileData(data: UserProfile) {
    this.profile = {
      name: data.name || 'User',
      email: data.email || '',
      location: data.location || '',
      domain: data.domainBadge || 'General',
      githubUrl: data.githubUrl || '',
      linkedinUrl: data.linkedinUrl || '',
      portfolioUrl: data.portfolioLink || '',
      photo: data.profilePhoto || 'https://via.placeholder.com/150'
    };
  }

  private populateSkillsData(backendSkills: BackendSkill[]) {
    if (!Array.isArray(backendSkills)) {
      this.skills = [];
      return;
    }

    this.skills = backendSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      level: this.mapProficiencyToLevel(skill.proficiency),
      category: this.inferSkillCategory(skill.name)
    }));
  }

  private populateCertificationsData(backendCerts: BackendCertification[]) {
    if (!Array.isArray(backendCerts)) {
      this.certifications = [];
      return;
    }

    this.certifications = backendCerts.map(cert => ({
      id: cert.id,
      name: cert.name,
      issuer: cert.issuer || 'Unknown',
      date: cert.date || new Date().toISOString().split('T')[0],
      description: cert.description || ''
    }));
  }

  private populateAchievementsData(backendAchievements: BackendAchievement[]) {
    if (!Array.isArray(backendAchievements)) {
      this.achievements = [];
      return;
    }

    this.achievements = backendAchievements.map(achievement => ({
      id: achievement.id,
      title: achievement.name,
      description: achievement.description,
      date: achievement.date || new Date().toISOString().split('T')[0]
    }));
  }

  private mapProficiencyToLevel(proficiency: string): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
    switch (proficiency.toLowerCase()) {
      case 'expert': return 'Expert';
      case 'advanced': return 'Advanced';
      case 'intermediate': return 'Intermediate';
      case 'beginner': return 'Beginner';
      default: return 'Intermediate';
    }
  }

  private inferSkillCategory(skillName: string): string {
    const skill = skillName.toLowerCase();
    if (skill.includes('react') || skill.includes('angular') || skill.includes('vue') || skill.includes('html') || skill.includes('css')) {
      return 'Frontend';
    } else if (skill.includes('node') || skill.includes('express') || skill.includes('spring') || skill.includes('django')) {
      return 'Backend';
    } else if (skill.includes('aws') || skill.includes('azure') || skill.includes('docker') || skill.includes('kubernetes')) {
      return 'Cloud';
    } else if (skill.includes('python') || skill.includes('java') || skill.includes('javascript') || skill.includes('typescript')) {
      return 'Programming';
    } else if (skill.includes('mongodb') || skill.includes('mysql') || skill.includes('postgres')) {
      return 'Database';
    } else if (skill.includes('machine') || skill.includes('ai') || skill.includes('ml')) {
      return 'AI/ML';
    } else {
      return 'Other';
    }
  }

  initDomainChart(domainData: any) {
    if (!domainData || !domainData.labels || !domainData.datasets) {
      this.initCharts();
      return;
    }

    this.domainChartData = {
      labels: domainData.labels,
      datasets: [
        {
          data: domainData.datasets[0].data,
          backgroundColor: [
            '#8a2be2',
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa'
          ],
          borderColor: [
            '#8a2be2',
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa'
          ],
          borderWidth: 3,
          hoverBorderWidth: 5,
          hoverBackgroundColor: [
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa',
            '#f0f8ff'
          ]
        }
      ]
    };

    this.domainChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ffffff',
            font: {
              size: 14,
              weight: '600'
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          },
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 63, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#e6e6fa',
          borderColor: '#8a2be2',
          borderWidth: 2,
          cornerRadius: 10,
          displayColors: true
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true
      }
    };
  }

  initPerformanceChart() {
    // Keep dummy data for Performance Metrics as requested
    this.atsChartData = {
      labels: ['Resume Score', 'Skills Match', 'Experience Level', 'Education', 'Certifications', 'Projects'],
      datasets: [
        {
          label: 'Performance Metrics',
          data: [85, 92, 78, 88, 95, 82],
          backgroundColor: [
            'rgba(138, 43, 226, 0.7)',
            'rgba(153, 50, 204, 0.7)',
            'rgba(186, 85, 211, 0.7)',
            'rgba(218, 112, 214, 0.7)',
            'rgba(221, 160, 221, 0.7)',
            'rgba(230, 230, 250, 0.7)'
          ],
          borderColor: [
            '#8a2be2',
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa'
          ],
          borderWidth: 3,
          hoverBorderWidth: 5
        }
      ]
    };

    this.atsChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ffffff',
            font: {
              size: 14,
              weight: '600'
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          },
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 63, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#e6e6fa',
          borderColor: '#8a2be2',
          borderWidth: 2,
          cornerRadius: 10,
          displayColors: true
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#b8b8d4',
            font: {
              size: 12,
              weight: '500'
            },
            stepSize: 20
          },
          grid: {
            color: 'rgba(184, 184, 212, 0.3)',
            lineWidth: 2
          },
          angleLines: {
            color: 'rgba(184, 184, 212, 0.3)',
            lineWidth: 1
          },
          pointLabels: {
            color: '#ffffff',
            font: {
              size: 13,
              weight: '600'
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true
      }
    };
  }

  initCharts() {
    // Fallback dummy data for domain chart
    this.domainChartData = {
      labels: ['Frontend Development', 'Backend Development', 'DevOps & Cloud', 'Data Science', 'Mobile Development', 'AI/ML'],
      datasets: [
        {
          data: [30, 25, 20, 15, 8, 2],
          backgroundColor: [
            '#8a2be2',
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa'
          ],
          borderColor: [
            '#8a2be2',
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa'
          ],
          borderWidth: 3,
          hoverBorderWidth: 5,
          hoverBackgroundColor: [
            '#9932cc',
            '#ba55d3',
            '#da70d6',
            '#dda0dd',
            '#e6e6fa',
            '#f0f8ff'
          ]
        }
      ]
    };

    this.domainChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ffffff',
            font: {
              size: 14,
              weight: '600'
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          },
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 63, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#e6e6fa',
          borderColor: '#8a2be2',
          borderWidth: 2,
          cornerRadius: 10,
          displayColors: true
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true
      }
    };

    // Initialize performance chart with dummy data
    this.initPerformanceChart();
  }

  // Profile editing methods
  toggleProfileEditing() {
    this.isProfileEditing = !this.isProfileEditing;
    if (this.isProfileEditing) {
      this.toastService.showInfo(
        'Edit Mode',
        'You can now edit your profile information.',
        3000
      );
    }
  }

  saveProfile() {
    if (!this.profile.name?.trim()) {
      this.toastService.showError(
        'Validation Error',
        'Name is required and cannot be empty.',
        4000
      );
      return;
    }

    if (!this.profile.email?.trim()) {
      this.toastService.showError(
        'Validation Error',
        'Email is required and cannot be empty.',
        4000
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profile.email)) {
      this.toastService.showError(
        'Validation Error',
        'Please enter a valid email address.',
        4000
      );
      return;
    }

    this.isProfileEditing = false;
    this.isDataModified = true;
    
    this.toastService.showInfo(
      'Saving Profile',
      'Updating your profile information...',
      2000
    );
    
    this.updateUserProfile();
  }

  // Skills management methods
  addSkill() {
    if (this.newSkill.name && this.newSkill.level && this.newSkill.category) {
      const skill: Skill = {
        id: Date.now(),
        name: this.newSkill.name!,
        level: this.newSkill.level!,
        category: this.newSkill.category!
      };
      this.skills.push(skill);
      this.newSkill = {};
      this.showAddSkillDialog = false;
      this.isDataModified = true;
      this.toastService.showSkillAddSuccess(skill.name);
      this.updateUserProfile();
    }
  }

  // Certifications management methods
  addCertification() {
    if (this.newCertification.name && this.newCertification.issuer) {
      const cert: Certification = {
        id: Date.now(),
        name: this.newCertification.name!,
        issuer: this.newCertification.issuer!,
        date: this.newCertification.date || new Date().toISOString().split('T')[0],
        description: this.newCertification.description || ''
      };
      this.certifications.push(cert);
      this.newCertification = {};
      this.showAddCertificationDialog = false;
      this.isDataModified = true;
      this.toastService.showCertificationAddSuccess(cert.name);
      this.updateUserProfile();
    }
  }

  // Achievements management methods
  addAchievement() {
    if (this.newAchievement.title && this.newAchievement.description) {
      const achievement: Achievement = {
        id: Date.now(),
        title: this.newAchievement.title!,
        description: this.newAchievement.description!,
        date: this.newAchievement.date || new Date().toISOString().split('T')[0]
      };
      this.achievements.push(achievement);
      this.newAchievement = {};
      this.showAddAchievementDialog = false;
      this.isDataModified = true;
      this.toastService.showAchievementAddSuccess(achievement.title);
      this.updateUserProfile();
    }
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'Expert': return '#7F00FF';
      case 'Advanced': return '#C400FF';
      case 'Intermediate': return '#B03EFF';
      case 'Beginner': return '#8B5CF6';
      default: return '#A855F7';
    }
  }

  // Add method to safely format dates
  formatDate(date: string): string {
    if (!date || date === 'Unknown' || date === '') {
      return '';
    }
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return '';
      }
      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }

  navigateToParseResume(): void {
    this.toastService.showInfo(
      'Redirecting',
      'Taking you to the resume parser to update your profile...',
      2000
    );
    setTimeout(() => {
      this.router.navigate(['/parse-resume'], { state: { firstTime: false } });
    }, 500);
  }

  dismissAnalysisNotification() {
    this.showAnalysisNotification = false;
    this.resumeAnalysisResult = null;
  }

  updateUserProfile() {
    if (!this.isDataModified) return;

    const updatePayload: UpdateProfilePayload = this.formatProfileForUpdate();
    
    this.userProfileService.updateUserProfile(updatePayload).subscribe({
      next: (response: UserProfile) => {
        this.toastService.showSuccess(
          'Profile Updated',
          'Your profile has been successfully updated.',
          3000
        );
        this.isDataModified = false;
        
        // Automatically fetch fresh data from backend after successful update
        this.refreshProfileData();
      },
      error: (error) => {
        this.toastService.showError(
          'Update Failed',
          'Failed to update profile. Please try again.',
          5000
        );
        console.error('Profile update error:', error);
      }
    });
  }

  // Add new method to refresh profile data from backend
  private refreshProfileData() {
    this.userProfileService.getUserProfile().subscribe({
      next: (data: UserProfile) => {
        // Update all sections with fresh backend data
        this.populateProfileData(data);
        this.populateSkillsData(data.skills || []);
        this.populateCertificationsData(data.certifications || []);
        this.populateAchievementsData(data.achievements || []);
        this.initDomainChart(data.domainData);
        
        this.toastService.showInfo(
          'Data Refreshed',
          'Dashboard updated with latest information.',
          2000
        );
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastService.showError(
          'Refresh Failed',
          'Could not fetch latest data from server.',
          3000
        );
        console.error('Profile refresh error:', error);
      }
    });
  }

  private formatProfileForUpdate(): UpdateProfilePayload {
    // Convert frontend format to backend format
    const backendSkills: BackendSkill[] = this.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      proficiency: skill.level
    }));

    const backendCertifications: BackendCertification[] = this.certifications.map(cert => ({
      id: cert.id,
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      description: cert.description
    }));

    const backendAchievements: BackendAchievement[] = this.achievements.map(achievement => ({
      id: achievement.id,
      name: achievement.title,
      description: achievement.description,
      date: achievement.date
    }));

    return {
      name: this.profile.name,
      email: this.profile.email,
      location: this.profile.location,
      domainBadge: this.profile.domain,
      githubUrl: this.profile.githubUrl || null,
      linkedinUrl: this.profile.linkedinUrl || null,
      portfolioLink: this.profile.portfolioUrl || null,
      profilePhoto: this.profile.photo,
      skills: backendSkills,
      certifications: backendCertifications,
      achievements: backendAchievements,
      domainData: this.domainChartData ? {
        labels: this.domainChartData.labels,
        datasets: this.domainChartData.datasets
      } : {
        labels: ['Frontend Development', 'Backend Development', 'DevOps & Cloud', 'Data Science', 'Mobile Development', 'AI/ML'],
        datasets: [{ data: [30, 25, 20, 15, 8, 2] }]
      }
    };
  }
}