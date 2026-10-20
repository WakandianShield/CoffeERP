import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: ` <aside>
      <a class="brand" routerLink="/ventas"
        ><span class="mark">C.</span
        ><span>CoffeERP<small>ADMINISTRACIÓN DE CAFETERÍA</small></span></a
      >
      <p class="nav-label">ESPACIO DE TRABAJO</p>
      <nav aria-label="Módulos">
        <a routerLink="/ventas" routerLinkActive="selected"><span>01</span> Ventas</a>
        @if (auth.user()?.role === 'ADMIN') {
          <a routerLink="/compras" routerLinkActive="selected"
            ><span>02</span> Compras y proveedores</a
          >
          <a routerLink="/inventario" routerLinkActive="selected"><span>03</span> Inventario</a>
          <a routerLink="/rrhh" routerLinkActive="selected"><span>04</span> Recursos humanos</a>
          <a routerLink="/finanzas" routerLinkActive="selected"
            ><span>05</span> Finanzas y contabilidad</a
          >
        }
      </nav>
      <div class="profile">
        <b>{{ auth.user()?.name }}</b
        ><small>{{ auth.user()?.role }}</small
        ><button class="secondary" (click)="logout()">Cerrar sesión</button>
      </div>
    </aside>
    <main>
      <div class="topbar">
        <span>Operación diaria / CoffeERP</span><span class="tag">ENTORNO ACADÉMICO · MXN</span>
      </div>
      <router-outlet />
    </main>`,
})
export class Shell {
  auth = inject(AuthService);
  router = inject(Router);
  logout() {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
