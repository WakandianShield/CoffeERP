// ESTE COMPONENTE MUESTRA Y ADMINISTRA LOS PEDIDOS DE LOS CLIENTES.
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Venta } from '../../shared/models';

interface PedidoAgrupado {
  orderId: number;
  clienteNombre: string;
  fecha: Date;
  metodoPago: string;
  total: number;
  estatus: 'pagada' | 'entregada';
  items: Venta[];
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent {
  ventas = signal<Venta[]>([]);

  searchQuery = signal('');
  expandedOrder = signal<number | null>(null);

  pedidos = computed<PedidoAgrupado[]>(() => {
    const ventasPagadas = this.ventas().filter(v => v.estatus === 'pagada' || v.estatus === 'entregada');
    const grouped = new Map<number, Venta[]>();
    ventasPagadas.forEach(v => {
      const existing = grouped.get(v.orderId) || [];
      existing.push(v);
      grouped.set(v.orderId, existing);
    });

    return Array.from(grouped.entries()).map(([orderId, items]) => ({
      orderId,
      clienteNombre: items[0].clienteNombre,
      fecha: items[0].fecha,
      metodoPago: items[0].metodoPago,
      total: items.reduce((sum, i) => sum + i.total, 0),
      estatus: items[0].estatus as 'pagada' | 'entregada',
      items
    })).filter(p => p.estatus === 'pagada');
  });

  filteredPedidos = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.pedidos().filter(p =>
      p.clienteNombre.toLowerCase().includes(query) ||
      p.orderId.toString().includes(query)
    );
  });

  toggleExpand(orderId: number): void {
    this.expandedOrder.update(current => current === orderId ? null : orderId);
  }

  confirmarEntrega(orderId: number): void {
    this.ventas.update(list =>
      list.map(v => v.orderId === orderId ? { ...v, estatus: 'entregada' as const } : v)
    );
    alert(`Pedido #${orderId} marcado como entregado`);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
}
