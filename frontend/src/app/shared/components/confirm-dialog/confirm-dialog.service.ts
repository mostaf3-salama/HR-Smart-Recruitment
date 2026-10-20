import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmConfig {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** When true the dialog also collects an optional note. */
  noteField?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  danger?: boolean;
}

export interface ConfirmResult {
  confirmed: boolean;
  note?: string;
}

interface PendingConfirm extends ConfirmConfig {
  resolve: (result: ConfirmResult) => void;
}

/**
 * Feature 1 — shared confirm dialog.
 * Usage: `const { confirmed, note } = await confirms.open({ title: '...' })`.
 * The <hr-confirm-dialog> shell (rendered once in AppComponent) shows it.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly pendingSubject = new BehaviorSubject<PendingConfirm | null>(null);
  readonly pending$: Observable<PendingConfirm | null> = this.pendingSubject.asObservable();

  open(config: ConfirmConfig): Promise<ConfirmResult> {
    return new Promise<ConfirmResult>((resolve) => {
      this.pendingSubject.next({ ...config, resolve });
    });
  }

  answer(confirmed: boolean, note?: string): void {
    const pending = this.pendingSubject.value;
    this.pendingSubject.next(null);
    pending?.resolve({ confirmed, note: note?.trim() || undefined });
  }
}
