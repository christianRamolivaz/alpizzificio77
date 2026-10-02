import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      if (authService.isAdmin(user)) {
        return true;
      }

      // Utente autenticato ma non amministratore
      console.warn('Accesso negato: l\'utente non possiede i permessi di amministratore.', user.email);
      router.navigate(['/'], { queryParams: { unauthorized: '1' } });
      return false;
    })
  );
};
