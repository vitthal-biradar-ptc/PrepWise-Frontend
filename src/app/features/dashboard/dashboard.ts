import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface Skill {
  id: number;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: string;
  isEditing: boolean;
}

interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  description: string;
  isEditing: boolean;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
  isEditing: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ChipModule,
    AvatarModule,
    BadgeModule,
    TextareaModule,
    DialogModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // Profile data
  profile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    location: 'San Francisco, CA',
    domain: 'Software Engineering',
    githubUrl: 'https://github.com/johndoe',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    portfolioUrl: 'https://johndoe.dev',
    photo: 'https://plus.unsplash.com/premium_photo-1739178656495-8109a8bc4f53?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  };

  // Chart data
  domainChartData: any;
  domainChartOptions: any;
  atsChartData: any;
  atsChartOptions: any;

  // Skills data
  skills: Skill[] = [
    { id: 1, name: 'JavaScript', level: 'Expert', category: 'Programming', isEditing: false },
    { id: 2, name: 'React', level: 'Advanced', category: 'Frontend', isEditing: false },
    { id: 3, name: 'Node.js', level: 'Advanced', category: 'Backend', isEditing: false },
    { id: 4, name: 'Python', level: 'Intermediate', category: 'Programming', isEditing: false },
    { id: 5, name: 'AWS', level: 'Intermediate', category: 'Cloud', isEditing: false },
    { id: 6, name: 'Docker', level: 'Beginner', category: 'DevOps', isEditing: false }
  ];

  // Certifications and achievements
  certifications: Certification[] = [
    { id: 1, name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2023-06-15', description: 'Associate level certification for cloud architecture', isEditing: false },
    { id: 2, name: 'Google Cloud Professional Developer', issuer: 'Google Cloud', date: '2023-03-20', description: 'Professional level certification for cloud development', isEditing: false }
  ];

  achievements: Achievement[] = [
    { id: 1, title: 'Best Developer Award', description: 'Recognized for outstanding contribution to open source projects', date: '2023-12-01', isEditing: false },
    { id: 2, title: 'Hackathon Winner', description: 'First place in regional hackathon for innovative AI solution', date: '2023-08-15', isEditing: false }
  ];

  // New item placeholders
  newSkill: Partial<Skill> = {};
  newCertification: Partial<Certification> = {};
  newAchievement: Partial<Achievement> = {};

  // Edit modes
  isProfileEditing = false;
  showAddSkillDialog = false;
  showAddCertificationDialog = false;
  showAddAchievementDialog = false;

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.initCharts();
  }

  initCharts() {
    // Domain Analysis Pie Chart
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

    // ATS Score Analysis Polar Area Chart
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

  // Profile editing methods
  toggleProfileEditing() {
    this.isProfileEditing = !this.isProfileEditing;
  }

  saveProfile() {
    this.isProfileEditing = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Profile Updated',
      detail: 'Your profile has been successfully updated!'
    });
  }

  // Skills management methods
  editSkill(skill: Skill) {
    skill.isEditing = true;
  }

  saveSkill(skill: Skill) {
    skill.isEditing = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Skill Updated',
      detail: `${skill.name} has been updated!`
    });
  }

  deleteSkill(skillId: number) {
    this.skills = this.skills.filter(s => s.id !== skillId);
    this.messageService.add({
      severity: 'info',
      summary: 'Skill Removed',
      detail: 'Skill has been removed from your profile.'
    });
  }

  addSkill() {
    if (this.newSkill.name && this.newSkill.level && this.newSkill.category) {
      const skill: Skill = {
        id: Date.now(),
        name: this.newSkill.name!,
        level: this.newSkill.level!,
        category: this.newSkill.category!,
        isEditing: false
      };
      this.skills.push(skill);
      this.newSkill = {};
      this.showAddSkillDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Skill Added',
        detail: `${skill.name} has been added to your skills!`
      });
    }
  }

  // Certifications management methods
  editCertification(cert: Certification) {
    cert.isEditing = true;
  }

  saveCertification(cert: Certification) {
    cert.isEditing = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Certification Updated',
      detail: `${cert.name} has been updated!`
    });
  }

  deleteCertification(certId: number) {
    this.certifications = this.certifications.filter(c => c.id !== certId);
    this.messageService.add({
      severity: 'info',
      summary: 'Certification Removed',
      detail: 'Certification has been removed from your profile.'
    });
  }

  addCertification() {
    if (this.newCertification.name && this.newCertification.issuer) {
      const cert: Certification = {
        id: Date.now(),
        name: this.newCertification.name!,
        issuer: this.newCertification.issuer!,
        date: this.newCertification.date || new Date().toISOString().split('T')[0],
        description: this.newCertification.description || '',
        isEditing: false
      };
      this.certifications.push(cert);
      this.newCertification = {};
      this.showAddCertificationDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Certification Added',
        detail: `${cert.name} has been added to your certifications!`
      });
    }
  }

  // Achievements management methods
  editAchievement(achievement: Achievement) {
    achievement.isEditing = true;
  }

  saveAchievement(achievement: Achievement) {
    achievement.isEditing = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Achievement Updated',
      detail: `${achievement.title} has been updated!`
    });
  }

  deleteAchievement(achievementId: number) {
    this.achievements = this.achievements.filter(a => a.id !== achievementId);
    this.messageService.add({
      severity: 'info',
      summary: 'Achievement Removed',
      detail: 'Achievement has been removed from your profile.'
    });
  }

  addAchievement() {
    if (this.newAchievement.title && this.newAchievement.description) {
      const achievement: Achievement = {
        id: Date.now(),
        title: this.newAchievement.title!,
        description: this.newAchievement.description!,
        date: this.newAchievement.date || new Date().toISOString().split('T')[0],
        isEditing: false
      };
      this.achievements.push(achievement);
      this.newAchievement = {};
      this.showAddAchievementDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Achievement Added',
        detail: `${achievement.title} has been added to your achievements!`
      });
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
}
