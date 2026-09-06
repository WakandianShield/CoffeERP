import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface RegistroNomina {
  id: number;
  empleado: string;
  periodo: string;
  percepciones: number;
  deducciones: number;
  netoPagar: number;
  fechaGeneracion: string;
}

@Component({
  selector: 'app-nomina',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './nomina.component.html',
  styleUrl: './nomina.component.css'
})
export class NominaComponent {
  registros = signal<RegistroNomina[]>([]);

  empleados = signal<string[]>([]);

  showModal = signal(false);
  showReceiptModal = signal(false);
  editingId = signal<number | null>(null);
  selectedRegistro = signal<RegistroNomina | null>(null);

  formEmpleado = signal('');
  formPeriodo = signal('');
  formPercepciones = signal(0);
  formDeducciones = signal(0);

  errors = signal<Record<string, string>>({});

  totalNomina = computed(() => this.registros().reduce((sum, r) => sum + r.netoPagar, 0));
  totalPercepciones = computed(() => this.registros().reduce((sum, r) => sum + r.percepciones, 0));
  totalDeducciones = computed(() => this.registros().reduce((sum, r) => sum + r.deducciones, 0));
  netoPagar = computed(() => this.totalPercepciones() - this.totalDeducciones());

  netoCalculado = computed(() => this.formPercepciones() - this.formDeducciones());

  openModal(id?: number): void {
    this.errors.set({});
    if (id) {
      const reg = this.registros().find(r => r.id === id);
      if (reg) {
        this.editingId.set(id);
        this.formEmpleado.set(reg.empleado);
        this.formPeriodo.set(reg.periodo);
        this.formPercepciones.set(reg.percepciones);
        this.formDeducciones.set(reg.deducciones);
      }
    } else {
      this.editingId.set(null);
      this.formEmpleado.set(this.empleados()[0]);
      this.formPeriodo.set('');
      this.formPercepciones.set(0);
      this.formDeducciones.set(0);
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.errors.set({});
  }

  openReceipt(id: number): void {
    const reg = this.registros().find(r => r.id === id);
    if (reg) {
      this.selectedRegistro.set(reg);
      this.showReceiptModal.set(true);
    }
  }

  closeReceipt(): void {
    this.showReceiptModal.set(false);
    this.selectedRegistro.set(null);
  }

  validate(): boolean {
    const errs: Record<string, string> = {};

    if (!this.formPeriodo().trim()) errs['periodo'] = 'El periodo es requerido';
    if (this.formPercepciones() <= 0) errs['percepciones'] = 'Las percepciones deben ser mayor a 0';
    if (this.formDeducciones() < 0) errs['deducciones'] = 'Las deducciones no pueden ser negativas';
    if (this.formDeducciones() > this.formPercepciones() && this.formPercepciones() > 0) {
      errs['deducciones'] = 'Las deducciones no pueden exceder las percepciones';
    }

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    const neto = this.formPercepciones() - this.formDeducciones();
    const hoy = new Date().toISOString().split('T')[0];

    const id = this.editingId();
    if (id) {
      this.registros.update(list =>
        list.map(r => r.id === id ? {
          ...r,
          empleado: this.formEmpleado(),
          periodo: this.formPeriodo(),
          percepciones: this.formPercepciones(),
          deducciones: this.formDeducciones(),
          netoPagar: neto
        } : r)
      );
    } else {
      const maxId = Math.max(...this.registros().map(r => r.id), 0);
      this.registros.update(list => [...list, {
        id: maxId + 1,
        empleado: this.formEmpleado(),
        periodo: this.formPeriodo(),
        percepciones: this.formPercepciones(),
        deducciones: this.formDeducciones(),
        netoPagar: neto,
        fechaGeneracion: hoy
      }]);
    }
    this.closeModal();
  }

  downloadReceipt(id: number): void {
    alert('Descargando recibo de nómina en formato PDF...');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}
