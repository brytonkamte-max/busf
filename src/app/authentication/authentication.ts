import { Component, inject, signal } from '@angular/core';
import { PortalUserService } from '../portal-user-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-authentication',
  imports: [FormsModule],
  templateUrl: './authentication.html',
  styleUrl: './authentication.css',
})
export class Authentication {
  portalUserService = inject(PortalUserService);

  message = signal('');
  errorMessage = signal('');

  loginData = {
    username: '',
    password: '',
  };

  doLogin(): void {
    this.message.set('');
    this.errorMessage.set('');

    this.portalUserService
      .doLogin(this.loginData.username, this.loginData.password)
      .subscribe({
        next: () => {
          this.message.set('Login effettuato con successo');
        },
        error: (err) => {
          if (typeof err?.error === 'string') {
            this.errorMessage.set(err.error);
          } else {
            this.errorMessage.set('Login non riuscito');
          }
        },
      });
  }
}
