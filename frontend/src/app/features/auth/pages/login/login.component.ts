import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

/** Feature 1 — /auth/login */
@Component({
  selector: 'hr-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  busy = false;
  errorMessage: string | null = null;

  submit(): void {
    if (this.form.invalid || this.busy) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy = true;
    this.errorMessage = null;

    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email ?? '', password: password ?? '' }).subscribe({
      next: (response) => {
        this.busy = false;
        this.toast.success(`Welcome, ${response.name}!`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : this.auth.homeFor(response.role));
      },
      error: () => {
        this.busy = false;
        this.errorMessage = 'Invalid email or password. Please try again.';
        // Zoneless: async callbacks don't refresh the view by themselves.
        this.cdr.markForCheck();
      },
    });
  }
}
