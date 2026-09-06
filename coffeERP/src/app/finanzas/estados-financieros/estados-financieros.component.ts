import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ActivoItem {
  concepto: string;
  monto: number;
}

interface PasivoItem {
  concepto: string;
  monto: number;
}

interface CapitalItem {
  concepto: string;
  monto: number;
}

interface ResultadoItem {
  concepto: string;
  monto: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

@Component({
  selector: 'app-estados-financieros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estados-financieros.component.html',
  styleUrl: './estados-financieros.component.css'
})
export class EstadosFinancierosComponent {
  fechaInicio = signal('2026-01-01');
  fechaFin = signal('2026-09-06');

  activos = signal<ActivoItem[]>([]);

  pasivos = signal<PasivoItem[]>([]);

  capital = signal<CapitalItem[]>([]);

  resultados = signal<ResultadoItem[]>([]);

  totalActivos = computed(() =>
    this.activos().reduce((sum, item) => sum + item.monto, 0)
  );

  totalPasivos = computed(() =>
    this.pasivos().reduce((sum, item) => sum + item.monto, 0)
  );

  totalCapital = computed(() =>
    this.capital().reduce((sum, item) => sum + item.monto, 0)
  );

  totalPasivoCapital = computed(() =>
    this.totalPasivos() + this.totalCapital()
  );

  ventasNetas = computed(() => this.resultados()[0]?.monto ?? 0);
  costoVentas = computed(() => Math.abs(this.resultados()[1]?.monto ?? 0));
  utilidadBruta = computed(() => this.resultados()[2]?.monto ?? 0);
  gastosAdministracion = computed(() => Math.abs(this.resultados()[3]?.monto ?? 0));
  gastosVenta = computed(() => Math.abs(this.resultados()[4]?.monto ?? 0));
  utilidadOperativa = computed(() => this.resultados()[5]?.monto ?? 0);
  impuestos = computed(() => Math.abs(this.resultados()[6]?.monto ?? 0));
  utilidadNeta = computed(() => this.resultados()[7]?.monto ?? 0);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  exportPdf(): void {
    alert('Exportación a PDF iniciada');
  }

  exportExcel(): void {
    alert('Exportación a Excel iniciada');
  }
}
