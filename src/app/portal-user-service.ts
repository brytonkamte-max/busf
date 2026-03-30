import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PortalUser } from './model/entities';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PortalUserService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = 'http://192.168.0.100:8080/api/users';

  private _loggedUser = signal<PortalUser | null>(this.getUserFromStorage());
  loggedUser = this._loggedUser.asReadonly();

  // Restituisce true solo se l'utente è loggato e il suo ruolo è 'ADMIN'
  isAdmin = computed(() => this._loggedUser()?.role === 'ADMIN');

  constructor() {}

  private getUserFromStorage(): PortalUser | null {
    let token = localStorage.getItem('token');

    if (!token) return null;

    return this.tokenToUser(token);
  }

  private tokenToUser(token: string): PortalUser | null {
    try {
      let payload = JSON.parse(atob(token.split('.')[1]));

      return {
        id: payload.id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        username: payload.username,
        email: payload.email,
        role: payload.role
      };
    } catch (e) {
      return null;
    }
  }

  public doLogin(username: string, password: string): Observable<any> {
    return this.http
      .post<any>(this.apiUrl + '/login', {
        username: username,
        password: password
      })
      .pipe(
        tap((json) => {
          let token = json.token;

          localStorage.setItem('token', token);
          this._loggedUser.set(this.tokenToUser(token));

          this.router.navigate(['/']);
        })
      );
  }

  public findAll(): Observable<PortalUser[]> {
    return this.http.get<PortalUser[]>(this.apiUrl);
  }

  public findById(id: number): Observable<PortalUser> {
    return this.http.get<PortalUser>(this.apiUrl + '/' + id);
  }

  public deleteById(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + '/' + id);
  }

  public doLogout(): void {
    localStorage.removeItem('token');
    this._loggedUser.set(null);
    this.router.navigate(['/authentication']);
  }

  public isLogged(): boolean {
    return !!localStorage.getItem('token');
  }

  public getLoggedUser(): PortalUser | null {
    return this._loggedUser();
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }
}
