import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../Service/auth.service';
import { API_PATHS } from '../Constants/ApiPaths';

export const authInterceptor: HttpInterceptorFn = (
  request,
  next
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  const publicAdminEndpoints = [
    `${API_PATHS.ADMIN}/ping`,
    `${API_PATHS.ADMIN}/conferma`,
    `${API_PATHS.ADMIN}/rifiuta`
  ];

  const isAdminRequest =
    request.url.startsWith(API_PATHS.ADMIN);

  const isPublicAdminRequest =
    publicAdminEndpoints.some(endpoint =>
      request.url === endpoint
    );

  /*
   * Non aggiunge il token:
   * - alle chiamate non amministrative;
   * - agli endpoint admin pubblici;
   * - quando il token non esiste.
   */
  if (
    !isAdminRequest ||
    isPublicAdminRequest ||
    !token
  ) {
    return next(request);
  }

  const authenticatedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();

        void router.navigate(
          ['/admin/login'],
          {
            queryParams: {
              sessionExpired: true
            }
          }
        );
      }

      return throwError(() => error);
    })
  );
};
