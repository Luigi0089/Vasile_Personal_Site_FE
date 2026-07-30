import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../Service/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly passwordVisible = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required
      ]
    ],
    password: [
      '',
      [
        Validators.required
      ]
    ]
  });

  constructor() {
    if (this.authService.isAdmin()) {
      void this.router.navigateByUrl('/admin');
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: response => {
          if (response.role !== 'ADMIN') {
            this.authService.logout();
            this.errorMessage.set(
              'Il tuo account non dispone dei permessi amministrativi.'
            );
            return;
          }

          void this.router.navigateByUrl('/admin');
        },

        error: (error: HttpErrorResponse) => {
          this.handleLoginError(error);
        }
      });
  }

  private handleLoginError(error: HttpErrorResponse): void {
    if (error.status === 0) {
      this.errorMessage.set(
        'Impossibile contattare il server. Riprova tra qualche istante.'
      );
      return;
    }

    if (
      error.status === 400 ||
      error.status === 401
    ) {
      this.errorMessage.set(
        'Username o password non corretti.'
      );
      return;
    }

    if (error.status === 403) {
      this.errorMessage.set(
        'Non disponi dei permessi necessari.'
      );
      return;
    }

    this.errorMessage.set(
      'Si è verificato un errore durante l’accesso.'
    );
  }
}
