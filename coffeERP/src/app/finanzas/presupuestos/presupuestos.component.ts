import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Presupuesto {
  id: number;
  area: string;
  montoAsignado: number;
  montoEjercido: number;
  periodo: string;
}

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presupuestos.component.html',
  styleUrl: './presupuestos.component.css'
})
export class PresupuestosComponent {
  presupuestos = signal<Presupuesto[]>([]);

  showModal = signal(false);

  formArea = signal('');
  formMontoAsignado = signal(0);
  formPeriodo = signal('');

  areaError = signal('');
  montoError = signal('');
  periodoError = signal('');

  getPorcentaje(ejercido: number, asignado: number): number {
    return Math.round((ejercido / asignado) * 100);
  }

  getColorClass(porcentaje: number): string {
    if (porcentaje > 85) return 'danger';
    if (porcentaje >= 60) return 'warning';
    return 'success';
  }

  openModal(): void {
    this.formArea.set('');
    this.formMontoAsignado.set(0);
    this.formPeriodo.set('');
    this.areaError.set('');
    this.montoError.set('');
    this.periodoError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.formArea.set('');
    this.formMontoAsignado.set(0);
    this.formPeriodo.set('');
    this.areaError.set('');
    this.montoError.set('');
    this.periodoError.set('');
  }

  validate(): boolean {
    let valid = true;
    this.areaError.set('');
    this.montoError.set('');
    this.periodoError.set('');

    if (!this.formArea().trim()) {
      this.areaError.set('El área o proyecto es requerido');
      valid = false;
    }

    if (this.formMontoAsignado() <= 0) {
      this.montoError.set('El monto debe ser mayor a 0');
      valid = false;
    }

    if (!this.formPeriodo().trim()) {
      this.periodoError.set('El periodo es requerido');
      valid = false;
    }

    return valid;
  }

  save(): void {
    if (!this.validate()) return;

    const newId = this.presupuestos().length > 0 ? Math.max(...this.presupuestos().map(p => p.id)) + 1 : 1;
    this.presupuestos.update(presupuestos => [
      ...presupuestos,
      {
        id: newId,
        area: this.formArea(),
        montoAsignado: this.formMontoAsignado(),
        montoEjercido: 0,
        periodo: this.formPeriodo()
      }
    ]);
    this.closeModal();
  }

  deletePresupuesto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
      this.presupuestos.update(presupuestos => presupuestos.filter(p => p.id !== id));
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}
