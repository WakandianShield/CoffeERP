// ESTE COMPONENTE CONTROLA EL FORMULARIO DE INICIO DE SESION.
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  emailError = signal('');
  passwordError = signal('');

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
    this.validateEmail();
    this.validatePassword();

    if (this.emailError() || this.passwordError()) return;

    alert('Inicio de sesión exitoso para: ' + this.email());
  }
}
