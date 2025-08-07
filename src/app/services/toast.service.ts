import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) {}

  showSuccess(summary: string, detail: string, life: number = 4000) {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life,
      sticky: false,
      closable: true
    });
  }

  showError(summary: string, detail: string, life: number = 6000) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life,
      sticky: false,
      closable: true
    });
  }

  showInfo(summary: string, detail: string, life: number = 4000) {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life,
      sticky: false,
      closable: true
    });
  }

  showWarn(summary: string, detail: string, life: number = 5000) {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life,
      sticky: false,
      closable: true
    });
  }

  // Specific toast methods for common actions
  showResumeParseSuccess(message?: string) {
    this.showSuccess(
      'Resume Parsed Successfully!',
      message || 'Your resume has been analyzed and profile updated automatically.',
      5000
    );
  }

  showResumeParseError(error?: string) {
    this.showError(
      'Resume Parse Failed',
      error || 'Unable to parse your resume. Please try again or contact support.',
      6000
    );
  }

  showResumeAnalysisSuccess(suggestionsCount?: number) {
    this.showSuccess(
      'Resume Analysis Complete!',
      `Analysis completed successfully${suggestionsCount ? ` with ${suggestionsCount} suggestions` : ''}.`,
      5000
    );
  }

  showResumeAnalysisError(error?: string) {
    this.showError(
      'Analysis Failed',
      error || 'Unable to analyze your resume. Please try again.',
      6000
    );
  }

  showProfileUpdateSuccess() {
    this.showSuccess(
      'Profile Updated',
      'Your profile information has been saved successfully.',
      3000
    );
  }

  showSkillAddSuccess(skillName: string) {
    this.showSuccess(
      'Skill Added',
      `${skillName} has been added to your skills list.`,
      3000
    );
  }

  showCertificationAddSuccess(certName: string) {
    this.showSuccess(
      'Certification Added',
      `${certName} has been added to your certifications.`,
      3000
    );
  }

  showAchievementAddSuccess(achievementTitle: string) {
    this.showSuccess(
      'Achievement Added',
      `${achievementTitle} has been added to your achievements.`,
      3000
    );
  }

  showDeleteSuccess(itemType: string) {
    this.showInfo(
      `${itemType} Removed`,
      `${itemType} has been removed from your profile.`,
      3000
    );
  }

  showFileUploadSuccess(fileName: string) {
    this.showSuccess(
      'File Uploaded',
      `${fileName} has been uploaded successfully.`,
      3000
    );
  }

  showFileUploadError(error?: string) {
    this.showError(
      'Upload Failed',
      error || 'Failed to upload file. Please try again.',
      5000
    );
  }

  showNetworkError() {
    this.showError(
      'Network Error',
      'Unable to connect to server. Please check your internet connection.',
      6000
    );
  }

  showGenericError(error?: string) {
    this.showError(
      'Something went wrong',
      error || 'An unexpected error occurred. Please try again.',
      5000
    );
  }

  showAuthSuccess(message: string) {
    this.showSuccess(
      'Authentication Successful',
      message,
      4000
    );
  }

  showAuthError(error?: string) {
    this.showError(
      'Authentication Failed',
      error || 'Please check your credentials and try again.',
      5000
    );
  }
}
