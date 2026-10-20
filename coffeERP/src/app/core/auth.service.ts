import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from './models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  user = signal<User | null>(null);
  // sessionStorage limita la sesión a esta pestaña; el backend comprueba JWT en cada solicitud.
  token = signal(sessionStorage.getItem('coffe-token') || '');
  async login(email: string, password: string) {
    const result = await firstValueFrom(
      this.http.post<{ token: string; user: User }>('/api/auth/login', { email, password }),
    );
    sessionStorage.setItem('coffe-token', result.token);
    this.token.set(result.token);
    this.user.set(result.user);
  }
  async restore() {
    if (!this.token()) return false;
    try {
      this.user.set(await firstValueFrom(this.http.get<User>('/api/auth/me')));
      return true;
    } catch {
      this.logout();
      return false;
    }
  }
  logout() {
    sessionStorage.removeItem('coffe-token');
    this.token.set('');
    this.user.set(null);
  }
}
