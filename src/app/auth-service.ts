import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Inizialmente l'utente è ospite (false)
  isAdmin = signal<boolean>(false);

  loginAsAdmin() {
    this.isAdmin.set(true);
  }

  logout() {
    this.isAdmin.set(false);
  }
}
