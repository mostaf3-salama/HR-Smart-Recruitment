import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

/**
 * Feature 1 — global notifications (replaces every local "flash message").
 * Toasts auto-dismiss; the <hr-toast> shell renders this stream.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  private push(tone: ToastTone, message: string): void {
    const toast: Toast = { id: this.nextId++, tone, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    const lifetime = tone === 'error' ? 6000 : 3500;
    setTimeout(() => this.dismiss(toast.id), lifetime);
  }
}
