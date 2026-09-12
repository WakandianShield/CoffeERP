// ESTE COMPONENTE CONTROLA LA VENTA Y EL CARRITO DE PRODUCTOS.
import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoVenta, Venta } from '../../shared/models';
import { ProductoService } from '../../shared/services/producto.service';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venta.component.html',
  styleUrl: './venta.component.css'
})
export class VentaComponent implements OnInit {
  // ESTA LISTA CONTIENE LOS PRODUCTOS QUE SE MUESTRAN EN EL PUNTO DE VENTA.
  // AQUI SE GUARDAN LOS PRODUCTOS, EL CLIENTE Y EL PAGO ACTUAL.
  productosVenta = signal<ProductoVenta[]>([]);

  ventas = signal<Venta[]>([]);

  cartItem = signal<{ producto: ProductoVenta; cantidad: number }[]>([]);

  paymentMethod = signal<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  searchQuery = signal('');
  clienteNombre = signal('');
  orderIdCounter = signal(1);

  constructor(private readonly productoService: ProductoService) {}

  // ESTA FUNCION CARGA LOS PRODUCTOS DESDE LA API.
  ngOnInit(): void {
    this.productoService.obtenerProductos().subscribe({
      next: datos => this.productosVenta.set(datos),
      error: error => console.error('Error al obtener productos:', error)
    });
  }

  filteredProducts = computed(() =>
    this.productosVenta().filter(p =>
      p.activo && p.nombre.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  // ESTOS VALORES SE USAN PARA MOSTRAR LOS TOTALES DE LA VENTA.
  cartTotal = computed(() =>
    this.cartItem().reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)
  );

  cartCount = computed(() =>
    this.cartItem().reduce((sum, i) => sum + i.cantidad, 0)
  );

  totalVentas = computed(() =>
    this.ventas().reduce((sum, v) => sum + v.total, 0)
  );

  ventasHoy = computed(() => {
    const today = new Date().toDateString();
    return this.ventas().filter(v => new Date(v.fecha).toDateString() === today).length;
  });

  addToCart(product: ProductoVenta) {
    this.cartItem.update(items => {
      const existing = items.find(i => i.producto.id === product.id);
      if (existing) {
        return items.map(i =>
          i.producto.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...items, { producto: product, cantidad: 1 }];
    });
  }

  removeFromCart(productId: number) {
    this.cartItem.update(items => items.filter(i => i.producto.id !== productId));
  }

  updateCartQuantity(productId: number, cantidad: number) {
    if (cantidad < 1) return;
    this.cartItem.update(items =>
      items.map(i =>
        i.producto.id === productId ? { ...i, cantidad } : i
      )
    );
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onClienteNombre(event: Event) {
    const target = event.target as HTMLInputElement;
    this.clienteNombre.set(target.value);
  }

  confirmPayment() {
    // ANTES DE GUARDAR, SE REVISA QUE HAYA CLIENTE Y PRODUCTOS.
    const nombre = this.clienteNombre().trim();
    if (!nombre) {
      alert('Ingrese el nombre del cliente');
      return;
    }
    const items = this.cartItem();
    if (!items.length) {
      alert('El carrito está vacío');
      return;
    }

    const newOrderId = this.orderIdCounter() + 1;
    this.orderIdCounter.set(newOrderId);

    const currentId = this.ventas().length
      ? Math.max(...this.ventas().map(v => v.id)) + 1
      : 1;

    const newVentas: Venta[] = items.map((item, index) => ({
      id: currentId + index,
      orderId: newOrderId,
      clienteNombre: nombre,
      productoVentaId: item.producto.id,
      productoNombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      total: item.producto.precio * item.cantidad,
      metodoPago: this.paymentMethod(),
      fecha: new Date(),
      estatus: 'pagada' as const
    }));

    this.ventas.update(ventas => [...ventas, ...newVentas]);
    alert(`Venta registrada para ${nombre} — ${this.cartCount()} productos`);
    this.cartItem.set([]);
    this.clienteNombre.set('');
    this.paymentMethod.set('efectivo');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}
