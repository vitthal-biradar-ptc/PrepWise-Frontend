import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addToast(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      duration: toast.duration ?? 5000,
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.removeToast(newToast.id);
      }, newToast.duration);
    }
  }

  success(message: string, duration?: number): void {
    this.addToast({
      message,
      type: 'success',
      duration,
    });
  }

  error(message: string, duration?: number): void {
    this.addToast({
      message,
      type: 'error',
      duration: duration ?? 8000, // Errors shown longer by default
    });
  }

  warning(message: string, duration?: number): void {
    this.addToast({
      message,
      type: 'warning',
      duration,
    });
  }

  info(message: string, duration?: number): void {
    this.addToast({
      message,
      type: 'info',
      duration,
    });
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((toast) => toast.id !== id));
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }
}
}
