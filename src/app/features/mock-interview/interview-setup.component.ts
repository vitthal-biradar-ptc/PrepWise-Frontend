import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterviewSetup } from '../../models/interview.models';

@Component({
  selector: 'app-interview-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-overlay">
      <div class="setup-modal">
        <div class="setup-header">
          <h2>Interview Setup</h2>
          <p>Configure your mock interview session</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="setup-form">
          <div class="form-group">
            <label for="role">What role are you preparing for?</label>
            <input 
              type="text" 
              id="role" 
              name="role"
              [(ngModel)]="setup.role"
              placeholder="e.g., Full Stack Developer, UI Designer, Data Scientist"
              required
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="level">Interview Difficulty Level</label>
            <select 
              id="level" 
              name="level"
              [(ngModel)]="setup.level"
              required
              class="form-select"
            >
              <option value="">Select difficulty</option>
              <option value="Easy">Easy - Basic concepts and common questions</option>
              <option value="Medium">Medium - Intermediate level with scenario-based questions</option>
              <option value="Hard">Hard - Advanced concepts and complex problem-solving</option>
            </select>
          </div>
          
          <div class="setup-actions">
            <button type="submit" class="btn-primary" [disabled]="!isFormValid()">
              Start Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .setup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(8px);
    }
    
    .setup-modal {
      background: #1a1a1a;
      border: 1px solid rgba(176, 62, 255, 0.35);
      border-radius: 16px;
      padding: 32px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .setup-header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .setup-header h2 {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .setup-header p {
      color: #A7A7A7;
      font-size: 16px;
    }
    
    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .form-group label {
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
    }
    
    .form-input,
    .form-select {
      background: #2d2d2d;
      border: 1px solid rgba(176, 62, 255, 0.35);
      border-radius: 8px;
      padding: 12px 16px;
      color: #ffffff;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    
    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: #B03EFF;
      box-shadow: 0 0 0 3px rgba(176, 62, 255, 0.15);
    }
    
    .form-input::placeholder {
      color: #888;
    }
    
    .setup-actions {
      margin-top: 16px;
    }
    
    .btn-primary {
      width: 100%;
      background: linear-gradient(135deg, #7F00FF, #C400FF);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 16px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(127, 0, 255, 0.35);
    }
    
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class InterviewSetupComponent {
  @Output() setupComplete = new EventEmitter<InterviewSetup>();
  
  setup: InterviewSetup = {
    role: '',
    level: '' // Now properly typed
  };
  
  onSubmit(): void {
    if (this.isFormValid()) {
      this.setupComplete.emit(this.setup);
    }
  }
  
  isFormValid(): boolean {
    return this.setup.role.trim().length > 0 && this.setup.level !== '';
  }
}

