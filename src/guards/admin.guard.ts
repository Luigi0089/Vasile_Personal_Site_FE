import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../Service/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  /*
   * Ricorda la pagina richiesta (es. il link "Gestisci dalla dashboard"
   * della mail), così dopo il login si torna lì.
   */
  return router.createUrlTree(
    ['/admin/login'],
    { queryParams: { returnUrl: state.url } }
  );
};
