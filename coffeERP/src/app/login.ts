import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './core/auth.service';
import { Page } from './core/page';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: ` <div class="login">
    <section class="login-story">
      <span class="mark">C.</span>
      <p class="eyebrow">COFFE ERP / CAFETERÍA</p>
      <h1>Todo en orden.<br />Un café a la vez.</h1>
      <p>
        Ventas, compras, inventario, equipo y finanzas.<br />Una operación conectada, en un solo
        lugar.
      </p>
      <div class="coffee-art" aria-hidden="true"><div class="cup"></div></div>
      <small>PROYECTO ACADÉMICO · PROGRAMACIÓN WEB II</small>
    </section>
    <section class="login-form">
      <p class="eyebrow">BIENVENIDO A TU ESPACIO</p>
      <h2>Iniciar sesión</h2>
      <p class="muted">Accede con la cuenta asignada por el administrador.</p>
      <form #f="ngForm" (ngSubmit)="submit()">
        <label
          >Correo electrónico<input
            type="email"
            name="email"
            [(ngModel)]="email"
            required
            email
            autocomplete="username" /></label
        ><label
          >Contraseña<input
            type="password"
            name="password"
            [(ngModel)]="password"
            required
            autocomplete="current-password" /></label
        ><button [disabled]="f.invalid || busy()">
          {{ busy() ? 'Comprobando…' : 'Entrar a CoffeERP →' }}
        </button>
      </form>
      <p role="alert" class="notice" [class.error]="error()" [hidden]="!message()">
        {{ message() }}
      </p>
      <small class="muted">Sesiones protegidas · Acceso según tu rol</small>
    </section>
  </div>`,
})
export class Login extends Page {
  auth = inject(AuthService);
  router = inject(Router);
  email = '';
  password = '';
  submit() {
    void this.run(async () => {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl('/ventas');
    }, '');
  }
}
