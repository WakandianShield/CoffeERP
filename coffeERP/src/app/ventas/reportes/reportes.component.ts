// ESTE COMPONENTE MUESTRA LOS REPORTES DE LAS VENTAS.
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta } from '../../shared/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent {
  ventas = signal<Venta[]>([]);

  fechaInicio = signal('');
  fechaFin = signal('');

  filteredVentas = computed(() => {
    const all = this.ventas();
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();
    if (!inicio && !fin) return all;
    return all.filter(v => {
      const fecha = new Date(v.fecha);
      if (inicio && fecha < new Date(inicio)) return false;
      if (fin && fecha > new Date(fin + 'T23:59:59')) return false;
      return true;
    });
  });

  totalVentas = computed(() =>
    this.filteredVentas().reduce((sum, v) => sum + v.total, 0)
  );

  numeroVentas = computed(() => this.filteredVentas().length);

  ticketPromedio = computed(() => {
    const count = this.numeroVentas();
    return count > 0 ? this.totalVentas() / count : 0;
  });

  ventasEfectivo = computed(() =>
    this.filteredVentas().filter(v => v.metodoPago === 'efectivo').reduce((sum, v) => sum + v.total, 0)
  );

  ventasTarjeta = computed(() =>
    this.filteredVentas().filter(v => v.metodoPago === 'tarjeta').reduce((sum, v) => sum + v.total, 0)
  );

  ventasTransferencia = computed(() =>
    this.filteredVentas().filter(v => v.metodoPago === 'transferencia').reduce((sum, v) => sum + v.total, 0)
  );

  maxMetodo = computed(() => Math.max(this.ventasEfectivo(), this.ventasTarjeta(), this.ventasTransferencia()));

  groupedByDate = computed(() => {
    const map = new Map<string, { fecha: string; ventas: Venta[]; total: number }>();
    for (const v of this.filteredVentas()) {
      const dateStr = this.formatDate(v.fecha);
      const existing = map.get(dateStr);
      if (existing) {
        existing.ventas.push(v);
        existing.total += v.total;
      } else {
        map.set(dateStr, { fecha: dateStr, ventas: [v], total: v.total });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  });

  onFechaInicio(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.fechaInicio.set(target.value);
  }

  onFechaFin(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.fechaFin.set(target.value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  getProducts(ventas: Venta[]): string {
    return ventas.map(v => v.productoNombre).join(', ');
  }

  getBarWidth(value: number): number {
    const max = this.maxMetodo();
    return max > 0 ? (value / max) * 100 : 0;
  }
}
