// ESTE COMPONENTE CONTROLA LAS CUENTAS POR COBRAR Y POR PAGAR.
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CuentaCP {
  id: number;
  tipo: string;
  clienteProveedor: string;
  monto: number;
  saldoPendiente: number;
  fechaVencimiento: string;
  estatus: string;
}

@Component({
  selector: 'app-cuentas-cobrar-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas-cobrar-pagar.component.html',
  styleUrl: './cuentas-cobrar-pagar.component.css'
})
export class CuentasCobrarPagarComponent {
  cuentas = signal<CuentaCP[]>([]);

  activeTab = signal<'cobrar' | 'pagar'>('cobrar');
  showModal = signal(false);

  formTipo = signal('cobrar');
  formClienteProveedor = signal('');
  formMonto = signal(0);
  formFechaVencimiento = signal('');

  clienteProveedorError = signal('');
  montoError = signal('');
  fechaError = signal('');

  filteredCuentas = computed(() => {
    return this.cuentas().filter(c => c.tipo === this.activeTab());
  });

  setTab(tab: 'cobrar' | 'pagar'): void {
    this.activeTab.set(tab);
  }

  openModal(tipo?: string): void {
    this.formTipo.set(tipo || this.activeTab());
    this.formClienteProveedor.set('');
    this.formMonto.set(0);
    this.formFechaVencimiento.set('');
    this.clienteProveedorError.set('');
    this.montoError.set('');
    this.fechaError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.formClienteProveedor.set('');
    this.formMonto.set(0);
    this.formFechaVencimiento.set('');
    this.clienteProveedorError.set('');
    this.montoError.set('');
    this.fechaError.set('');
  }

  validate(): boolean {
    let valid = true;
    this.clienteProveedorError.set('');
    this.montoError.set('');
    this.fechaError.set('');

    if (!this.formClienteProveedor().trim()) {
      this.clienteProveedorError.set('El nombre es requerido');
      valid = false;
    }

    if (this.formMonto() <= 0) {
      this.montoError.set('El monto debe ser mayor a 0');
      valid = false;
    }

    if (!this.formFechaVencimiento()) {
      this.fechaError.set('La fecha de vencimiento es requerida');
      valid = false;
    } else if (new Date(this.formFechaVencimiento()) < new Date()) {
      this.fechaError.set('La fecha no puede ser en el pasado');
      valid = false;
    }

    return valid;
  }

  save(): void {
    if (!this.validate()) return;

    const newId = this.cuentas().length > 0 ? Math.max(...this.cuentas().map(c => c.id)) + 1 : 1;
    this.cuentas.update(cuentas => [
      ...cuentas,
      {
        id: newId,
        tipo: this.formTipo(),
        clienteProveedor: this.formClienteProveedor(),
        monto: this.formMonto(),
        saldoPendiente: this.formMonto(),
        fechaVencimiento: this.formFechaVencimiento(),
        estatus: 'pendiente'
      }
    ]);
    this.closeModal();
  }

  deleteCuenta(id: number): void {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.cuentas.update(cuentas => cuentas.filter(c => c.id !== id));
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-MX');
  }
}
