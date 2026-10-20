import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '../core/page';
import { Employee, Payroll } from '../core/models';
@Component({
  selector: 'app-employees',
  imports: [FormsModule],
  template: ` <header>
      <p class="eyebrow">04 / EQUIPO</p>
      <h1>Recursos humanos</h1>
      <p>Expedientes básicos y registro mensual de salarios pagados.</p>
    </header>
    <p role="status" class="notice" [class.error]="error()" [hidden]="!message()">
      {{ message() }}
    </p>
    <div class="two-col">
      <section class="panel">
        <h2>{{ editId ? 'Editar empleado' : 'Nuevo empleado' }}</h2>
        <form #f="ngForm" (ngSubmit)="save()">
          <label
            >Nombre completo<input
              name="name"
              [(ngModel)]="employee.name"
              required
              minlength="2" /></label
          ><label
            >Puesto<input name="position" [(ngModel)]="employee.position" required minlength="2"
          /></label>
          <div class="fields">
            <label
              >Correo<input
                type="email"
                name="email"
                [(ngModel)]="employee.email"
                required
                email /></label
            ><label
              >Salario mensual (MXN)<input
                type="number"
                name="salary"
                [(ngModel)]="salary"
                min="0.01"
                step="0.01"
                required
            /></label>
          </div>
          <label class="check"
            ><input type="checkbox" name="active" [(ngModel)]="employee.active" /> Empleado
            activo</label
          >
          <div class="actions">
            <button [disabled]="f.invalid || busy()">Guardar empleado</button
            ><button type="button" class="secondary" (click)="reset()">Limpiar</button>
          </div>
        </form>
      </section>
      <section class="panel">
        <h2>Registrar salario pagado</h2>
        <p class="muted">Un registro por empleado y mes. Genera el egreso en finanzas.</p>
        <form #n="ngForm" (ngSubmit)="pay()">
          <label
            >Empleado<select name="employee" [(ngModel)]="employeeId" required>
              <option [ngValue]="0" disabled>Selecciona un empleado</option>
              @for (e of employees(); track e.id) {
                @if (e.active) {
                  <option [ngValue]="e.id">{{ e.name }} · {{ money(e.salary_cents) }}</option>
                }
              }
            </select></label
          ><label>Periodo<input type="month" name="period" [(ngModel)]="period" required /></label
          ><button [disabled]="n.invalid || !employeeId || busy()">Registrar pago del mes</button>
        </form>
      </section>
    </div>
    <section class="panel">
      <h2>Personal</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puesto</th>
              <th>Correo</th>
              <th>Salario</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (e of employees(); track e.id) {
              <tr>
                <td>{{ e.name }}</td>
                <td>{{ e.position }}</td>
                <td>{{ e.email }}</td>
                <td>{{ money(e.salary_cents) }}</td>
                <td>{{ e.active ? 'Activo' : 'Inactivo' }}</td>
                <td><button class="secondary" (click)="edit(e)">Editar</button></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty">Registra a tu equipo.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h2>Historial de salarios</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Periodo</th>
              <th>Pagado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of payroll(); track p.id) {
              <tr>
                <td>{{ p.name }}</td>
                <td>{{ p.period }}</td>
                <td>{{ money(p.amount_cents) }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="empty">Sin pagos de salarios.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <details class="panel">
      <summary>Crear cuenta de acceso al sistema</summary>
      <p class="muted">
        Las cuentas son independientes de los expedientes laborales. Solo el administrador puede
        crearlas.
      </p>
      <form #a="ngForm" (ngSubmit)="account()">
        <div class="fields">
          <label>Nombre<input name="name" [(ngModel)]="user.name" required minlength="2" /></label
          ><label
            >Correo<input
              type="email"
              name="email"
              [(ngModel)]="user.email"
              required
              email /></label
          ><label
            >Contraseña<input
              type="password"
              name="password"
              [(ngModel)]="user.password"
              required
              minlength="10"
              maxlength="72"
              autocomplete="new-password"
            /><small>10 caracteres mínimo, mayúscula, número y símbolo.</small></label
          ><label
            >Rol<select name="role" [(ngModel)]="user.role">
              <option>CAJERO</option>
              <option>ADMIN</option>
            </select></label
          >
        </div>
        <button [disabled]="a.invalid || busy()">Crear cuenta</button>
      </form>
    </details>`,
})
export class Employees extends Page implements OnInit {
  employees = signal<Employee[]>([]);
  payroll = signal<Payroll[]>([]);
  employee = { name: '', position: '', email: '', active: true };
  salary = 0;
  editId = 0;
  employeeId = 0;
  period = new Date().toISOString().slice(0, 7);
  user = { name: '', email: '', password: '', role: 'CAJERO' };
  ngOnInit() {
    void this.run(() => this.load(), '');
  }
  async load() {
    this.employees.set(await this.api.get('/employees'));
    this.payroll.set(await this.api.get('/payroll'));
  }
  reset() {
    this.editId = 0;
    this.salary = 0;
    this.employee = { name: '', position: '', email: '', active: true };
  }
  edit(e: Employee) {
    this.editId = e.id;
    this.salary = e.salary_cents / 100;
    this.employee = { name: e.name, position: e.position, email: e.email, active: !!e.active };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  save() {
    void this.run(async () => {
      const b = { ...this.employee, salary_cents: Math.round(this.salary * 100) };
      if (this.editId) await this.api.put('/employees/' + this.editId, b);
      else await this.api.post('/employees', b);
      this.reset();
      await this.load();
    });
  }
  pay() {
    void this.run(async () => {
      await this.api.post('/payroll', { employee_id: this.employeeId, period: this.period });
      await this.load();
    }, 'Salario registrado en finanzas');
  }
  account() {
    void this.run(async () => {
      await this.api.post('/auth/users', this.user);
      this.user = { name: '', email: '', password: '', role: 'CAJERO' };
    }, 'Cuenta creada');
  }
}
