import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../shared/services/usuario.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: '../login/login.component.css'
})
export class RegistroComponent {
  // ESTAS VARIABLES GUARDAN LOS DATOS DEL FORMULARIO DE REGISTRO.
  email = signal('');
  password = signal('');
  error = signal('');
  mensaje = signal('');

  constructor(private readonly usuarioService: UsuarioService, private readonly router: Router) {}

  // ESTA FUNCION ENVIA EL NUEVO USUARIO AL BACKEND.
  registrar(): void {
    this.error.set('');
    this.mensaje.set('');
    if (!this.email() || !this.password()) {
      this.error.set('Correo y contraseña son obligatorios');
      return;
    }

    this.usuarioService.registrar({ email: this.email(), password: this.password() }).subscribe({
      next: () => {
        this.mensaje.set('Usuario registrado correctamente');
        setTimeout(() => this.router.navigate(['/login']), 700);
      },
      error: error => this.error.set(error.error?.mensaje || 'No se pudo registrar el usuario')
    });
  }
}
