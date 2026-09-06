import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DetallePoliza {
  id: number;
  cuenta: string;
  cargo: number;
  abono: number;
}

interface Poliza {
  id: number;
  fecha: string;
  tipo: string;
  origen: string;
  totalCargos: number;
  totalAbonos: number;
  estatus: string;
  detalles: DetallePoliza[];
}

@Component({
  selector: 'app-polizas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './polizas.component.html',
  styleUrl: './polizas.component.css'
})
export class PolizasComponent {
  polizas = signal<Poliza[]>([]);

  showModal = signal(false);
  editingId = signal<number | null>(null);

  formFecha = signal('');
  formTipo = signal('ingreso');
  formOrigen = signal('');
  detalles = signal<DetallePoliza[]>([
    { id: 1, cuenta: '', cargo: 0, abono: 0 }
  ]);

  fechaError = signal('');
  origenError = signal('');
  balanceError = signal('');

  totalCargos = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cargo, 0)
  );

  totalAbonos = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.abono, 0)
  );

  isBalanced = computed(() => this.totalCargos() === this.totalAbonos() && this.totalCargos() > 0);

  cuentas = [
    'Caja General',
    'Banco Nacional',
    'Proveedores',
    'Capital Social',
    'Ventas',
    'Gastos de Administración',
    'Inventario',
    'Costo de Ventas'
  ];

  openModal(poliza?: Poliza): void {
    if (poliza) {
      this.editingId.set(poliza.id);
      this.formFecha.set(poliza.fecha);
      this.formTipo.set(poliza.tipo);
      this.formOrigen.set(poliza.origen);
      this.detalles.set([...poliza.detalles]);
    } else {
      this.editingId.set(null);
      this.formFecha.set(new Date().toISOString().split('T')[0]);
      this.formTipo.set('ingreso');
      this.formOrigen.set('');
      this.detalles.set([{ id: 1, cuenta: '', cargo: 0, abono: 0 }]);
    }
    this.fechaError.set('');
    this.origenError.set('');
    this.balanceError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formFecha.set('');
    this.formTipo.set('ingreso');
    this.formOrigen.set('');
    this.detalles.set([{ id: 1, cuenta: '', cargo: 0, abono: 0 }]);
    this.fechaError.set('');
    this.origenError.set('');
    this.balanceError.set('');
  }

  addDetalle(): void {
    const currentDetalles = this.detalles();
    const newId = Math.max(...currentDetalles.map(d => d.id)) + 1;
    this.detalles.set([...currentDetalles, { id: newId, cuenta: '', cargo: 0, abono: 0 }]);
  }

  removeDetalle(id: number): void {
    if (this.detalles().length > 1) {
      this.detalles.update(d => d.filter(det => det.id !== id));
    }
  }

  updateDetalleCuenta(id: number, value: string): void {
    this.detalles.update(d =>
      d.map(det => det.id === id ? { ...det, cuenta: value } : det)
    );
  }

  updateDetalleCargo(id: number, value: number): void {
    this.detalles.update(d =>
      d.map(det => det.id === id ? { ...det, cargo: value, abono: 0 } : det)
    );
  }

  updateDetalleAbono(id: number, value: number): void {
    this.detalles.update(d =>
      d.map(det => det.id === id ? { ...det, abono: value, cargo: 0 } : det)
    );
  }

  validate(): boolean {
    let valid = true;
    this.fechaError.set('');
    this.origenError.set('');
    this.balanceError.set('');

    if (!this.formFecha()) {
      this.fechaError.set('La fecha es requerida');
      valid = false;
    }

    if (!this.formOrigen().trim()) {
      this.origenError.set('El origen es requerido');
      valid = false;
    }

    if (!this.isBalanced()) {
      this.balanceError.set('Los cargos y abonos deben ser iguales');
      valid = false;
    }

    return valid;
  }

  save(): void {
    if (!this.validate()) return;

    const id = this.editingId();
    const cargos = this.totalCargos();
    const abonos = this.totalAbonos();

    if (id) {
      this.polizas.update(polizas =>
        polizas.map(p =>
          p.id === id
            ? {
                ...p,
                fecha: this.formFecha(),
                tipo: this.formTipo(),
                origen: this.formOrigen(),
                totalCargos: cargos,
                totalAbonos: abonos,
                detalles: [...this.detalles()]
              }
            : p
        )
      );
    } else {
      const newId = this.polizas().length > 0 ? Math.max(...this.polizas().map(p => p.id)) + 1 : 1;
      this.polizas.update(polizas => [
        ...polizas,
        {
          id: newId,
          fecha: this.formFecha(),
          tipo: this.formTipo(),
          origen: this.formOrigen(),
          totalCargos: cargos,
          totalAbonos: abonos,
          estatus: 'borrador',
          detalles: [...this.detalles()]
        }
      ]);
    }
    this.closeModal();
  }

  deletePoliza(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta póliza?')) {
      this.polizas.update(polizas => polizas.filter(p => p.id !== id));
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}
