import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta, NotaCredito } from '../../shared/models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.css'
})
export class PagosComponent {
  ventas = signal<Venta[]>([]);

  notasCredito = signal<NotaCredito[]>([]);

  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = 5;
  showModal = signal(false);
  selectedOrderId = signal<number | null>(null);
  motivo = signal('');

  groupedVentas = computed(() => {
    const map = new Map<number, { orderId: number; clienteNombre: string; total: number; metodoPago: string; fecha: Date; estatus: string; items: Venta[] }>();
    for (const v of this.ventas()) {
      const existing = map.get(v.orderId);
      if (existing) {
        existing.total += v.total;
        existing.items.push(v);
      } else {
        map.set(v.orderId, {
          orderId: v.orderId,
          clienteNombre: v.clienteNombre,
          total: v.total,
          metodoPago: v.metodoPago,
          fecha: v.fecha,
          estatus: v.estatus,
          items: [v]
        });
      }
    }
    return Array.from(map.values());
  });

  filteredVentas = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.groupedVentas().filter(g =>
      g.clienteNombre.toLowerCase().includes(query) ||
      g.items.some(i => i.productoNombre.toLowerCase().includes(query))
    );
  });

  totalPages = computed(() => Math.ceil(this.filteredVentas().length / this.itemsPerPage));

  paginatedVentas = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredVentas().slice(start, start + this.itemsPerPage);
  });

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  openDevolucionModal(orderId: number): void {
    this.selectedOrderId.set(orderId);
    this.motivo.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedOrderId.set(null);
    this.motivo.set('');
  }

  confirmarDevolucion(): void {
    const orderId = this.selectedOrderId();
    if (!orderId || !this.motivo().trim()) return;

    const orderItems = this.ventas().filter(v => v.orderId === orderId);
    if (!orderItems.length) return;

    this.ventas.update(ventas =>
      ventas.map(v => v.orderId === orderId ? { ...v, estatus: 'devuelta' as const } : v)
    );

    let nextId = this.notasCredito().length > 0
      ? Math.max(...this.notasCredito().map(n => n.id)) + 1
      : 1;

    const newNotas: NotaCredito[] = orderItems.map(item => ({
      id: nextId++,
      orderId: item.orderId,
      clienteNombre: item.clienteNombre,
      productoNombre: item.productoNombre,
      monto: item.total,
      motivo: this.motivo().trim(),
      fecha: new Date()
    }));

    this.notasCredito.update(notas => [...notas, ...newNotas]);

    this.closeModal();
    alert('Devolución registrada. Notas de crédito creadas para cada producto.');
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
}
