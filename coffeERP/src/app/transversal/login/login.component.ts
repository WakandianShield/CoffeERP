// ESTE COMPONENTE CONTROLA EL FORMULARIO DE INICIO DE SESION.
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../shared/services/usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // ESTAS VARIABLES GUARDAN LOS DATOS DEL FORMULARIO DE LOGIN.
  email = signal('');
  password = signal('');
  emailError = signal('');
  passwordError = signal('');
  mensajeError = signal('');

  constructor(private readonly usuarioService: UsuarioService, private readonly router: Router) {}

  validateEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email()) {
      this.emailError.set('El correo es requerido');
    } else if (!emailRegex.test(this.email())) {
      this.emailError.set('Formato de correo inválido');
    } else {
      this.emailError.set('');
    }
  }

  validatePassword(): void {
    if (!this.password()) {
      this.passwordError.set('La contraseña es requerida');
    } else {
      this.passwordError.set('');
    }
  }

  onEmailChange(value: string): void {
    this.email.set(value);
    this.validateEmail();
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    this.validatePassword();
  }

  onSubmit(): void {
	// ESTA FUNCION VALIDA LOS CAMPOS Y ENVIA EL LOGIN AL BACKEND.
    this.validateEmail();
    this.validatePassword();

    if (this.emailError() || this.passwordError()) return;

    this.mensajeError.set('');
    this.usuarioService.iniciarSesion({ email: this.email(), password: this.password() }).subscribe({
      next: respuesta => {
        this.usuarioService.guardarSesion(respuesta.usuario);
        this.router.navigate(['/dashboard']);
      },
      error: error => this.mensajeError.set(error.error?.mensaje || 'No se pudo iniciar sesión')
    });
  }
}
