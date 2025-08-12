import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { InterviewResult, InterviewCard } from '../../../models/interview.models';

@Injectable({
  providedIn: 'root'
})
export class InterviewResultsService {
  private readonly STORAGE_KEY = 'interview_results';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private getStorageItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private setStorageItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  async saveInterviewResult(result: InterviewResult): Promise<void> {
    try {
      // Get existing results
      const existingResults = await this.getInterviewResults();
      
      // Add new result
      existingResults.push(result);
      
      // Save to localStorage (in production, this would be an API call)
      this.setStorageItem(this.STORAGE_KEY, JSON.stringify(existingResults));
      
      console.info('Interview result saved successfully:', result.id);
    } catch (error) {
      console.error('Error saving interview result:', error);
      throw error;
    }
  }

  async getInterviewResults(): Promise<InterviewResult[]> {
    try {
      const stored = this.getStorageItem(this.STORAGE_KEY);
      if (stored) {
        const results = JSON.parse(stored);
        // Convert date strings back to Date objects
        return results.map((result: any) => ({
          ...result,
          startTime: new Date(result.startTime),
          endTime: new Date(result.endTime)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error retrieving interview results:', error);
      return [];
    }
  }

  async getInterviewCards(): Promise<InterviewCard[]> {
    try {
      const results = await this.getInterviewResults();
      
      return results.map(result => {
        const category = this.getCategoryFromRole(result.role);
        const status = this.getStatusFromResult(result);
        const progress = this.getProgressFromResult(result);
        
        return {
          id: result.id,
          title: result.role,
          category: category,
          level: result.level,
          time: `${result.duration} min`,
          questions: result.questions.length,
          progress: progress,
          status: status
        };
      });
    } catch (error) {
      console.error('Error generating interview cards:', error);
      return [];
    }
  }

  async getInterviewResult(id: string): Promise<InterviewResult | null> {
    try {
      const results = await this.getInterviewResults();
      return results.find(result => result.id === id) || null;
    } catch (error) {
      console.error('Error retrieving interview result:', error);
      return null;
    }
  }

  async deleteInterviewResult(id: string): Promise<void> {
    try {
      const results = await this.getInterviewResults();
      const filteredResults = results.filter(result => result.id !== id);
      
      this.setStorageItem(this.STORAGE_KEY, JSON.stringify(filteredResults));
      console.info('Interview result deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting interview result:', error);
      throw error;
    }
  }

  private getCategoryFromRole(role: string): string {
    const roleLower = role.toLowerCase();
    
    if (roleLower.includes('developer') || roleLower.includes('engineer') || roleLower.includes('programmer')) {
      return 'SOFTWARE ENGINEERING';
    } else if (roleLower.includes('designer') || roleLower.includes('ui') || roleLower.includes('ux')) {
      return 'DESIGN & CREATIVE';
    } else if (roleLower.includes('lawyer') || roleLower.includes('attorney') || roleLower.includes('legal')) {
      return 'LEGAL';
    } else if (roleLower.includes('accountant') || roleLower.includes('finance') || roleLower.includes('analyst')) {
      return 'FINANCE';
    } else if (roleLower.includes('manager') || roleLower.includes('lead') || roleLower.includes('director')) {
      return 'MANAGEMENT';
    } else if (roleLower.includes('marketing') || roleLower.includes('sales') || roleLower.includes('business')) {
      return 'BUSINESS & MARKETING';
    } else {
      return 'OTHER';
    }
  }

  private getStatusFromResult(result: InterviewResult): 'completed' | 'in-progress' | 'not-started' {
    // For now, all saved results are considered completed
    // In a real app, you might have different statuses
    return 'completed';
  }

  private getProgressFromResult(result: InterviewResult): number {
    // Calculate progress based on questions answered
    if (result.questions.length === 0) return 0;
    
    const answeredQuestions = result.questions.filter(q => q.userAnswer && q.userAnswer.trim() !== '');
    return Math.round((answeredQuestions.length / result.questions.length) * 100);
  }

  // Mock data for development/testing
  async getMockInterviewCards(): Promise<InterviewCard[]> {
    return [
      {
        id: '1',
        title: 'Android Developer',
        category: 'SOFTWARE ENGINEERING',
        level: 'Hard',
        time: '35 min',
        questions: 15,
        progress: 100,
        status: 'completed'
      },
      {
        id: '2',
        title: 'UI Designer',
        category: 'DESIGN & CREATIVE',
        level: 'Medium',
        time: '45 min',
        questions: 25,
        progress: 75,
        status: 'in-progress'
      },
      {
        id: '3',
        title: 'Contract Lawyer',
        category: 'LEGAL',
        level: 'Hard',
        time: '60 min',
        questions: 20,
        progress: 0,
        status: 'not-started'
      },
      {
        id: '4',
        title: 'Accountant',
        category: 'FINANCE',
        level: 'Medium',
        time: '40 min',
        questions: 18,
        progress: 0,
        status: 'not-started'
      }
    ];
  }
}
