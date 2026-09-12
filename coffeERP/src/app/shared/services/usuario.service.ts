import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  // ESTA ES LA DIRECCION DE LA API DE USUARIOS.
  private readonly api = 'http://localhost:3200/api/usuarios';
  private readonly claveUsuario = 'coffeerp_usuario';
  readonly usuarioActual = signal<User | null>(this.cargarUsuario());

  constructor(private readonly http: HttpClient) {}

  // ESTA FUNCION ENVIA LOS DATOS PARA REGISTRAR UN USUARIO.
  registrar(usuario: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.api}/registro`, {
      ...usuario,
      roles: [],
      active: true
    });
  }

  // ESTA FUNCION ENVIA LOS DATOS PARA INICIAR SESION.
  iniciarSesion(datos: LoginRequest): Observable<{ mensaje: string; usuario: User }> {
    return this.http.post<{ mensaje: string; usuario: User }>(`${this.api}/login`, datos);
  }

  // ESTA FUNCION GUARDA EL USUARIO QUE INICIO SESION.
  guardarSesion(usuario: User): void {
    this.usuarioActual.set(usuario);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.claveUsuario, JSON.stringify(usuario));
    }
  }

  // ESTA FUNCION CIERRA LA SESION Y QUITA EL USUARIO GUARDADO.
  cerrarSesion(): void {
    this.usuarioActual.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.claveUsuario);
    }
  }

  // ESTA FUNCION RECUPERA EL USUARIO DESPUES DE RECARGAR LA PAGINA.
  private cargarUsuario(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const usuarioGuardado = localStorage.getItem(this.claveUsuario);
    if (!usuarioGuardado) return null;

    try {
      return JSON.parse(usuarioGuardado) as User;
    } catch (_error) {
      localStorage.removeItem(this.claveUsuario);
      return null;
    }
  }
}
