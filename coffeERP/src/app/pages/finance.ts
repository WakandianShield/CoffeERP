import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '../core/page';
import { Entry } from '../core/models';
@Component({
  selector: 'app-finance',
  imports: [FormsModule],
  template: ` <header>
      <p class="eyebrow">05 / CONTROL FINANCIERO</p>
      <h1>Finanzas y contabilidad</h1>
      <p>Libro de ingresos y egresos. Ventas, compras y nómina se registran automáticamente.</p>
    </header>
    <p role="status" class="notice" [class.error]="error()" [hidden]="!message()">
      {{ message() }}
    </p>
    <div class="metrics">
      <div>
        <span>INGRESOS</span><strong>{{ money(data().income) }}</strong>
      </div>
      <div>
        <span>EGRESOS</span><strong>{{ money(data().expense) }}</strong>
      </div>
      <div>
        <span>SALDO DE MOVIMIENTOS</span
        ><strong>{{ money(data().income - data().expense) }}</strong>
      </div>
    </div>
    <section class="panel">
      <h2>Otro ingreso o gasto</h2>
      <form #f="ngForm" (ngSubmit)="save()">
        <div class="fields three">
          <label
            >Tipo<select name="kind" [(ngModel)]="entry.kind">
              <option>INGRESO</option>
              <option>EGRESO</option>
            </select></label
          ><label
            >Concepto<input
              name="concept"
              [(ngModel)]="entry.concept"
              required
              minlength="2"
              maxlength="150" /></label
          ><label
            >Importe (MXN)<input
              type="number"
              name="amount"
              [(ngModel)]="amount"
              min="0.01"
              step="0.01"
              required
          /></label>
        </div>
        <button [disabled]="f.invalid || busy()">Registrar movimiento</button>
      </form>
    </section>
    <section class="panel">
      <h2>Libro de movimientos</h2>
      <p class="muted">
        Últimos 200 movimientos. Los totales incluyen todo el historial. El saldo representa flujo
        de caja, no utilidad fiscal.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            @for (e of data().entries; track e.id) {
              <tr>
                <td>#{{ e.id }}</td>
                <td>
                  <span class="tag" [class.warning]="e.kind === 'EGRESO'">{{ e.kind }}</span>
                </td>
                <td>{{ e.concept }}</td>
                <td>{{ money(e.amount_cents) }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">No hay movimientos registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>`,
})
export class Finance extends Page implements OnInit {
  data = signal<{ entries: Entry[]; income: number; expense: number }>({
    entries: [],
    income: 0,
    expense: 0,
  });
  entry = { kind: 'EGRESO', concept: '' };
  amount = 0;
  ngOnInit() {
    void this.run(() => this.load(), '');
  }
  async load() {
    this.data.set(await this.api.get('/finance'));
  }
  save() {
    void this.run(async () => {
      await this.api.post('/finance', {
        ...this.entry,
        amount_cents: Math.round(this.amount * 100),
      });
      this.entry.concept = '';
      this.amount = 0;
      await this.load();
    });
  }
}
