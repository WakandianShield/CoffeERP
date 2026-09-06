import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isRegisterMode = signal(false);
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  emailError = signal('');
  passwordError = signal('');
  confirmPasswordError = signal('');

  passwordValidations = computed(() => {
    const p = this.password();
    return {
      minLength: p.length >= 8,
      hasUppercase: /[A-Z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p)
    };
  });

  allPasswordValid = computed(() => {
    const v = this.passwordValidations();
    return v.minLength && v.hasUppercase && v.hasNumber && v.hasSymbol;
  });

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
    const p = this.password();
    const errors: string[] = [];
    if (!p) {
      errors.push('La contraseña es requerida');
    } else {
      if (p.length < 8) errors.push('Mínimo 8 caracteres');
      if (!/[A-Z]/.test(p)) errors.push('1 letra mayúscula');
      if (!/[0-9]/.test(p)) errors.push('1 número');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p)) errors.push('1 símbolo');
    }
    this.passwordError.set(errors.length ? 'Requiere: ' + errors.join(', ') : '');
  }

  validateConfirmPassword(): void {
    if (this.isRegisterMode() && this.confirmPassword() && this.confirmPassword() !== this.password()) {
      this.confirmPasswordError.set('Las contraseñas no coinciden');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  onEmailChange(value: string): void {
    this.email.set(value);
    this.validateEmail();
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    this.validatePassword();
    if (this.isRegisterMode()) this.validateConfirmPassword();
  }

  onConfirmPasswordChange(value: string): void {
    this.confirmPassword.set(value);
    this.validateConfirmPassword();
  }

  toggleMode(): void {
    this.isRegisterMode.update(v => !v);
    this.emailError.set('');
    this.passwordError.set('');
    this.confirmPasswordError.set('');
    this.email.set('');
    this.password.set('');
    this.confirmPassword.set('');
  }

  onSubmit(): void {
    this.validateEmail();
    this.validatePassword();
    if (this.isRegisterMode()) this.validateConfirmPassword();

    if (this.emailError() || this.passwordError()) return;
    if (this.isRegisterMode() && this.confirmPasswordError()) return;

    if (this.isRegisterMode()) {
      alert('Registro exitoso para: ' + this.email());
    } else {
      alert('Inicio de sesión exitoso para: ' + this.email());
    }
  }
}
