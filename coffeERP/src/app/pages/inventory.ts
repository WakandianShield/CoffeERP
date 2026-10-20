import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '../core/page';
import { Product, Movement } from '../core/models';
@Component({
  selector: 'app-inventory',
  imports: [FormsModule],
  template: ` <header>
      <p class="eyebrow">03 / EXISTENCIAS</p>
      <h1>Inventario</h1>
      <p>Productos terminados, disponibilidad y movimientos de almacén.</p>
    </header>
    <p role="status" class="notice" [class.error]="error()" [hidden]="!message()">
      {{ message() }}
    </p>
    <div class="two-col">
      <section class="panel">
        <h2>{{ editId ? 'Editar producto' : 'Nuevo producto' }}</h2>
        <form #f="ngForm" (ngSubmit)="save()">
          <label
            >Nombre<input
              name="name"
              [(ngModel)]="product.name"
              required
              minlength="2"
              maxlength="100"
          /></label>
          <div class="fields">
            <label
              >Precio de venta (MXN)<input
                type="number"
                name="price"
                [(ngModel)]="price"
                min="0.01"
                step="0.01"
                required /></label
            ><label
              >Existencia mínima<input
                type="number"
                name="minimum"
                [(ngModel)]="product.minimum"
                min="0"
                step="1"
                required
            /></label>
          </div>
          <label class="check"
            ><input type="checkbox" name="active" [(ngModel)]="product.active" /> Producto
            activo</label
          >
          <div class="actions">
            <button [disabled]="f.invalid || busy()">Guardar producto</button
            ><button type="button" class="secondary" (click)="reset()">Limpiar</button>
          </div>
        </form>
      </section>
      <section class="panel">
        <h2>Ajuste de inventario</h2>
        <p class="muted">
          Cantidad positiva para entrada, negativa para salida. No sustituye el registro de compras.
        </p>
        <form #m="ngForm" (ngSubmit)="adjust()">
          <label
            >Producto<select name="product" [(ngModel)]="movement.product_id" required>
              <option [ngValue]="0" disabled>Selecciona un producto</option>
              @for (p of products(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }}</option>
              }
            </select></label
          >
          <div class="fields">
            <label
              >Cantidad<input
                type="number"
                name="quantity"
                [(ngModel)]="movement.quantity"
                required
                step="1" /></label
            ><label
              >Motivo<input name="reason" [(ngModel)]="movement.reason" required minlength="2"
            /></label>
          </div>
          <button [disabled]="m.invalid || !movement.product_id || !movement.quantity || busy()">
            Registrar ajuste
          </button>
        </form>
      </section>
    </div>
    <section class="panel">
      <h2>Catálogo y existencias</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Existencia</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td>
                  <b>{{ p.name }}</b>
                </td>
                <td>{{ money(p.price_cents) }}</td>
                <td>{{ p.stock }}</td>
                <td>{{ p.reserved }}</td>
                <td>{{ p.stock - p.reserved }}</td>
                <td>
                  <span class="tag" [class.warning]="p.stock - p.reserved <= p.minimum">{{
                    !p.active
                      ? 'Inactivo'
                      : p.stock - p.reserved <= p.minimum
                        ? 'Stock bajo'
                        : 'Disponible'
                  }}</span>
                </td>
                <td><button class="secondary" (click)="edit(p)">Editar</button></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">Registra tu primer producto para comenzar.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h2>Últimos movimientos</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (m of movements(); track m.id) {
              <tr>
                <td>{{ m.name }}</td>
                <td>{{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}</td>
                <td>{{ m.reason }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="empty">Aún no hay movimientos.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>`,
})
export class Inventory extends Page implements OnInit {
  products = signal<Product[]>([]);
  movements = signal<Movement[]>([]);
  editId = 0;
  price = 0;
  product = { name: '', minimum: 5, active: true };
  movement = { product_id: 0, quantity: 1, reason: '' };
  ngOnInit() {
    void this.run(() => this.load(), '');
  }
  async load() {
    this.products.set(await this.api.get<Product[]>('/products'));
    this.movements.set(await this.api.get<Movement[]>('/inventory'));
  }
  reset() {
    this.editId = 0;
    this.price = 0;
    this.product = { name: '', minimum: 5, active: true };
  }
  edit(p: Product) {
    this.editId = p.id;
    this.price = p.price_cents / 100;
    this.product = { name: p.name, minimum: p.minimum, active: !!p.active };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  save() {
    void this.run(async () => {
      const body = { ...this.product, price_cents: Math.round(this.price * 100) };
      if (this.editId) await this.api.put('/products/' + this.editId, body);
      else await this.api.post('/products', body);
      this.reset();
      await this.load();
    });
  }
  adjust() {
    void this.run(async () => {
      await this.api.post('/inventory', this.movement);
      this.movement.reason = '';
      await this.load();
    }, 'Existencias actualizadas');
  }
}
