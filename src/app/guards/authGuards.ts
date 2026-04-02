import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalUserService } from '../portal-user-service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userService = inject(PortalUserService);

  const token = localStorage.getItem('token');

  //  non loggato
  if (!token) {
    return router.createUrlTree(['/authentication']);
  }

  //  utente loggato
  const user = userService.loggedUser();

  // ruoli richiesti dalla route
  const allowedRoles = route.data?.['role'];

  //  se la route ha restrizioni
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return router.createUrlTree(['/']); // oppure pagina errore
  }

  return true;
};