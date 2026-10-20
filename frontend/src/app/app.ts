import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from './shared/components/toast/toast.component';

/**
 * Application root. The Layout (navbar/sidebar) owns the authenticated
 * area; the toast + confirm shells live here so any page can use them.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, ConfirmDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <hr-toast></hr-toast>
    <hr-confirm-dialog></hr-confirm-dialog>
  `,
})
export class App {}
