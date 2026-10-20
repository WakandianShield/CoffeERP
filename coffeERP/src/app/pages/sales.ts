import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Page } from '../core/page';
import { Product, Sale, CartItem } from '../core/models';
import { PaypalService } from '../core/paypal.service';
@Component({
  selector: 'app-sales',
  imports: [FormsModule],
  template: ` <header>
      <p class="eyebrow">01 / PUNTO DE VENTA</p>
      <h1>Una nueva venta.</h1>
      <p>Selecciona los productos, confirma el cobro y entrega la factura XML.</p>
    </header>
    <p role="status" class="notice" [class.error]="error()" [hidden]="!message()">
      {{ message() }}
    </p>
    <div class="sales-grid">
      <section>
        <div class="section-heading">
          <h2>Menú de la cafetería</h2>
          <span class="muted">{{ products().length }} productos</span>
        </div>
        <div class="product-grid">
          @for (p of products(); track p.id) {
            <button
              class="product-card"
              [disabled]="busy() || p.stock - p.reserved <= inCart(p.id)"
              (click)="add(p)"
            >
              <span class="product-icon">{{ p.name.charAt(0) }}</span
              ><b>{{ p.name }}</b
              ><small>{{ p.stock - p.reserved }} disponibles</small
              ><span class="product-bottom"
                ><strong>{{ money(p.price_cents) }}</strong
                ><span>＋</span></span
              >
            </button>
          } @empty {
            <div class="panel empty">
              No hay productos activos. Un administrador puede agregarlos en Inventario.
            </div>
          }
        </div>
      </section>
      <section class="panel checkout">
        <p class="eyebrow">ORDEN ACTUAL</p>
        <h2>Tu pedido</h2>
        @for (item of cart(); track item.id) {
          <div class="cart-line">
            <div>
              <b>{{ name(item.id) }}</b
              ><small>{{ money(price(item.id) * item.cantidad) }}</small>
            </div>
            <div class="counter">
              <button class="secondary" [disabled]="busy()" (click)="remove(item.id)">−</button
              ><span>{{ item.cantidad }}</span
              ><button class="secondary" [disabled]="busy()" (click)="increase(item.id)">+</button>
            </div>
          </div>
        } @empty {
          <p class="empty">Agrega productos del menú.</p>
        }
        <div class="checkout-total">
          <span>Total MXN</span><strong>{{ money(total()) }}</strong>
        </div>
        <form #f="ngForm">
          <fieldset [disabled]="busy()">
            <label
              >Nombre del cliente<input
                name="customer"
                [(ngModel)]="customer"
                required
                minlength="2"
                maxlength="100"
                autocomplete="name" /></label
            ><label
              >Correo para la factura<input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                email
                autocomplete="email"
            /></label>
          </fieldset>
          <button
            type="button"
            class="full"
            [disabled]="f.invalid || !cart().length || busy()"
            (click)="cash()"
          >
            Registrar cobro en efectivo</button
          ><button
            type="button"
            class="paypal full"
            [disabled]="f.invalid || !cart().length || busy() || !session"
            (click)="pay()"
          >
            Pagar con PayPal · Sandbox
          </button>
        </form>
        <p class="muted small">{{ paypalMessage() }}</p>
        <p class="muted small">Se genera una factura académica XML sin validez fiscal.</p>
      </section>
    </div>
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Historial de ventas</h2>
          <p class="muted">
            Si se interrumpe el pago, verifica su estado antes de iniciar otra venta.
          </p>
        </div>
        <button class="secondary" [disabled]="busy()" (click)="refresh()">Actualizar</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Folio / Cliente</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (s of sales(); track s.id) {
              <tr>
                <td>
                  <b>{{ s.customer }}</b
                  ><small>{{ s.id.slice(0, 8) }}</small>
                </td>
                <td>{{ money(s.total_cents) }}</td>
                <td>{{ s.method }}</td>
                <td>
                  <span class="tag" [class.warning]="s.status !== 'PAGADA'">{{ s.status }}</span>
                </td>
                <td>{{ s.email_status === 'ENVIADA' ? 'Aceptado por correo' : s.email_status }}</td>
                <td>
                  <div class="actions">
                    @if (s.status === 'PAGADA') {
                      <button class="secondary" [disabled]="busy()" (click)="xml(s.id)">XML</button>
                      @if (s.email_status !== 'ENVIADA') {
                        <button class="secondary" [disabled]="busy()" (click)="send(s.id)">
                          Enviar correo
                        </button>
                      }
                    } @else if (s.status !== 'CANCELADA') {
                      <button class="secondary" [disabled]="busy()" (click)="verify(s.id)">
                        Verificar pago
                      </button>
                      @if (s.status === 'CREADA' || s.status === 'CREANDO') {
                        <button class="secondary" [disabled]="busy()" (click)="cancel(s.id)">
                          Cancelar reserva
                        </button>
                      }
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty">Aquí aparecerán tus ventas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>`,
})
export class Sales extends Page implements OnInit {
  paypal = inject(PaypalService);
  products = signal<Product[]>([]);
  sales = signal<Sale[]>([]);
  cart = signal<CartItem[]>([]);
  customer = '';
  email = '';
  paypalMessage = signal('Preparando PayPal…');
  session: Awaited<ReturnType<PaypalService['setup']>> | null = null;
  private pendingId = '';
  ngOnInit() {
    void this.run(() => this.load(), '');
    void this.setup();
  }
  async load() {
    this.products.set((await this.api.get<Product[]>('/products')).filter((p) => p.active));
    this.sales.set(await this.api.get<Sale[]>('/sales'));
  }
  async setup() {
    try {
      this.session = await this.paypal.setup({
        onApprove: async () => {
          try {
            await this.api.post('/sales/' + this.pendingId + '/capture', {});
            this.cart.set([]);
            this.message.set('Pago completado. Consulta el estado del correo en el historial.');
            this.error.set(false);
          } catch (e: any) {
            this.error.set(true);
            this.message.set(
              e.error?.mensaje || 'Pago pendiente de verificación. Usa Verificar pago.',
            );
          } finally {
            this.busy.set(false);
            await this.load();
          }
        },
        onCancel: () => {
          this.busy.set(false);
          this.message.set(
            'Pago cancelado en PayPal. Cancela la reserva en el historial para liberar existencias.',
          );
          void this.load();
        },
        onError: () => {
          this.busy.set(false);
          this.error.set(true);
          this.message.set('PayPal no confirmó el pago. Revisa el historial.');
          void this.load();
        },
      });
      this.paypalMessage.set('Pruebas con una cuenta compradora de PayPal Sandbox.');
    } catch (e: any) {
      this.paypalMessage.set(e.message || 'PayPal no disponible');
    }
  }
  name(id: number) {
    return this.products().find((p) => p.id === id)?.name || '';
  }
  price(id: number) {
    return this.products().find((p) => p.id === id)?.price_cents || 0;
  }
  inCart(id: number) {
    return this.cart().find((p) => p.id === id)?.cantidad || 0;
  }
  add(p: Product) {
    if (p.stock - p.reserved <= this.inCart(p.id) || this.inCart(p.id) >= 100) return;
    this.cart.update((items) =>
      items.some((i) => i.id === p.id)
        ? items.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...items, { id: p.id, cantidad: 1 }],
    );
  }
  increase(id: number) {
    const p = this.products().find((p) => p.id === id);
    if (p) this.add(p);
  }
  remove(id: number) {
    this.cart.update((items) =>
      items
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0),
    );
  }
  total() {
    return this.cart().reduce((sum, i) => sum + this.price(i.id) * i.cantidad, 0);
  }
  cash() {
    if (!confirm('¿Confirmas que recibiste el efectivo?')) return;
    void this.run(async () => {
      await this.api.post('/sales/cash', {
        customer: this.customer,
        email: this.email,
        productos: this.cart(),
      });
      this.cart.set([]);
      await this.load();
    }, 'Venta pagada. Consulta el estado de envío de su factura en el historial.');
  }
  // start se invoca desde el gesto del usuario; la orden se resuelve de forma asíncrona.
  async pay() {
    if (!this.session || this.busy()) return;
    this.busy.set(true);
    this.error.set(false);
    this.message.set('Abriendo PayPal…');
    try {
      await this.session.start(
        { presentationMode: 'auto' },
        this.paypal.create(this.customer, this.email, this.cart()).then((order) => {
          this.pendingId = order.saleId;
          return { orderId: order.id };
        }),
      );
    } catch (e: any) {
      this.busy.set(false);
      this.error.set(true);
      this.message.set(
        e.error?.mensaje ||
          'No se pudo iniciar PayPal. Revisa el historial antes de volver a pagar.',
      );
      await this.load();
    }
  }
  refresh() {
    void this.run(() => this.load(), '');
  }
  xml(id: string) {
    void this.run(() => this.api.download(id), 'Factura XML descargada');
  }
  send(id: string) {
    void this.run(async () => {
      await this.api.post('/sales/' + id + '/email', {});
      await this.load();
    }, 'Factura aceptada por el servicio de correo');
  }
  verify(id: string) {
    void this.run(async () => {
      await this.api.post('/sales/' + id + '/capture', {});
      await this.load();
    }, 'Pago confirmado');
  }
  cancel(id: string) {
    if (!confirm('¿Cancelar esta reserva y liberar existencias?')) return;
    void this.run(async () => {
      await this.api.post('/sales/' + id + '/cancel', {});
      await this.load();
    }, 'Reserva cancelada');
  }
}
