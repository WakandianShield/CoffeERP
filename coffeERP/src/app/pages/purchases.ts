import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '../core/page';
import { Product, Supplier, Purchase } from '../core/models';
@Component({
  selector: 'app-purchases',
  imports: [FormsModule],
  template: ` <header>
      <p class="eyebrow">02 / ABASTECIMIENTO</p>
      <h1>Compras y proveedores</h1>
      <p>Registra mercancía recibida y pagada. Las existencias y el egreso se actualizan juntos.</p>
    </header>
    <p role="status" class="notice" [class.error]="error()" [hidden]="!message()">
      {{ message() }}
    </p>
    <div class="two-col">
      <section class="panel">
        <h2>Nuevo proveedor</h2>
        <form #f="ngForm" (ngSubmit)="saveSupplier()">
          <label
            >Nombre<input name="name" [(ngModel)]="supplier.name" required minlength="2" /></label
          ><label
            >Correo<input
              name="email"
              type="email"
              [(ngModel)]="supplier.email"
              required
              email /></label
          ><label
            >Teléfono<input
              name="phone"
              [(ngModel)]="supplier.phone"
              required
              minlength="7" /></label
          ><button [disabled]="f.invalid || busy()">Guardar proveedor</button>
        </form>
      </section>
      <section class="panel">
        <h2>Registrar compra</h2>
        <form #c="ngForm" (ngSubmit)="savePurchase()">
          <label
            >Proveedor<select name="supplier" [(ngModel)]="supplierId" required>
              <option [ngValue]="0" disabled>Selecciona un proveedor</option>
              @for (s of suppliers(); track s.id) {
                <option [ngValue]="s.id">{{ s.name }}</option>
              }
            </select></label
          ><label
            >Producto<select name="product" [(ngModel)]="productId" required>
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
                [(ngModel)]="quantity"
                min="1"
                max="100"
                step="1"
                required /></label
            ><label
              >Costo unitario (MXN)<input
                type="number"
                name="cost"
                [(ngModel)]="cost"
                min="0.01"
                step="0.01"
                required
            /></label>
          </div>
          <p class="total">Total: {{ money(Math.round(cost * 100) * quantity) }}</p>
          <button [disabled]="c.invalid || !supplierId || !productId || busy()">
            Registrar recepción y pago
          </button>
        </form>
      </section>
    </div>
    <section class="panel">
      <h2>Compras recientes</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Compra</th>
              <th>Proveedor</th>
              <th>Importe</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (p of purchases(); track p.id) {
              <tr>
                <td>#{{ p.id }}</td>
                <td>{{ p.supplier }}</td>
                <td>{{ money(p.total_cents) }}</td>
                <td><span class="tag">Recibida y pagada</span></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">Aún no hay compras.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h2>Proveedores</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            @for (s of suppliers(); track s.id) {
              <tr>
                <td>{{ s.name }}</td>
                <td>{{ s.email }}</td>
                <td>{{ s.phone }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="empty">Aún no hay proveedores.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>`,
})
export class Purchases extends Page implements OnInit {
  Math = Math;
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  purchases = signal<Purchase[]>([]);
  supplier = { name: '', email: '', phone: '' };
  supplierId = 0;
  productId = 0;
  quantity = 1;
  cost = 0;
  ngOnInit() {
    void this.run(() => this.load(), '');
  }
  async load() {
    this.suppliers.set(await this.api.get<Supplier[]>('/suppliers'));
    this.products.set((await this.api.get<Product[]>('/products')).filter((p) => p.active));
    this.purchases.set(await this.api.get<Purchase[]>('/purchases'));
  }
  saveSupplier() {
    void this.run(async () => {
      await this.api.post('/suppliers', this.supplier);
      this.supplier = { name: '', email: '', phone: '' };
      await this.load();
    });
  }
  savePurchase() {
    void this.run(async () => {
      await this.api.post('/purchases', {
        supplier_id: this.supplierId,
        productos: [
          { id: this.productId, cantidad: this.quantity, cost_cents: Math.round(this.cost * 100) },
        ],
      });
      this.quantity = 1;
      this.cost = 0;
      await this.load();
    }, 'Compra registrada; inventario y finanzas actualizados');
  }
}
