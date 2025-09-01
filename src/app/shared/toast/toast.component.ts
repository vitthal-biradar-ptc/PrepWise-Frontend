import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-4 z-[9999] space-y-2 pointer-events-none">
      @for (toast of toasts; track toast.id) {
      <div
        class="toast-item pointer-events-auto transform"
        [class]="getToastClasses(toast)"
        [@slideIn]
      >
        <div
          class="flex items-center gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm border"
        >
          <div class="flex-shrink-0">
            <span class="text-lg">{{ getToastIcon(toast.type) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium break-words">{{ toast.message }}</p>
          </div>
          <button
            (click)="removeToast(toast.id)"
            class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <span class="text-lg">×</span>
          </button>
        </div>
      </div>
      }
    </div>
  `,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          transform: 'translateX(100%) scale(0.9)', 
          opacity: 0 
        }),
        animate('200ms ease-out', style({ 
          transform: 'translateX(0) scale(1)', 
          opacity: 1 
        }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ 
          transform: 'translateX(100%) scale(0.9)', 
          opacity: 0 
        }))
      ])
    ])
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getToastClasses(toast: Toast): string {
    const baseClasses = 'max-w-sm w-full';

    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-green-50/95 border-green-200 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50/95 border-red-200 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50/95 border-yellow-200 text-yellow-800`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50/95 border-blue-200 text-blue-800`;
    }
  }

  getToastIcon(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }
}
