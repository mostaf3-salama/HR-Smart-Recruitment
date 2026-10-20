import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Feature 1 — counts in-flight /api calls so the layout can show
 * a thin progress bar. Pages keep their own Loading states too.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private readonly activeSubject = new BehaviorSubject<boolean>(false);
  readonly active$ = this.activeSubject.asObservable();

  begin(): void {
    this.pending++;
    if (this.pending === 1) this.activeSubject.next(true);
  }

  end(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) this.activeSubject.next(false);
  }
}
