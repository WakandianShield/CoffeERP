import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Cuenta {
  id: number;
  nombre: string;
  tipo: string;
  saldo: number;
  estatus: string;
}

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas.component.html',
  styleUrl: './cuentas.component.css'
})
export class CuentasComponent {
  cuentas = signal<Cuenta[]>([]);

  searchQuery = signal('');
  currentPage = signal(1);
  itemsPerPage = 5;
  showModal = signal(false);
  editingId = signal<number | null>(null);

  formNombre = signal('');
  formTipo = signal('activo');
  formSaldo = signal(0);

  nombreError = signal('');
  saldoError = signal('');

  filteredCuentas = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.cuentas().filter(c =>
      c.nombre.toLowerCase().includes(query) ||
      c.tipo.toLowerCase().includes(query)
    );
  });

  totalPages = computed(() => Math.ceil(this.filteredCuentas().length / this.itemsPerPage));

  paginatedCuentas = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredCuentas().slice(start, start + this.itemsPerPage);
  });

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  openModal(cuenta?: Cuenta): void {
    if (cuenta) {
      this.editingId.set(cuenta.id);
      this.formNombre.set(cuenta.nombre);
      this.formTipo.set(cuenta.tipo);
      this.formSaldo.set(cuenta.saldo);
    } else {
      this.editingId.set(null);
      this.formNombre.set('');
      this.formTipo.set('activo');
      this.formSaldo.set(0);
    }
    this.nombreError.set('');
    this.saldoError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formNombre.set('');
    this.formTipo.set('activo');
    this.formSaldo.set(0);
    this.nombreError.set('');
    this.saldoError.set('');
  }

  validate(): boolean {
    let valid = true;
    this.nombreError.set('');
    this.saldoError.set('');

    if (this.formNombre().length < 3 || this.formNombre().length > 100) {
      this.nombreError.set('El nombre debe tener entre 3 y 100 caracteres');
      valid = false;
    }

    if (this.formSaldo() < 0) {
      this.saldoError.set('El saldo no puede ser negativo');
      valid = false;
    }

    return valid;
  }

  save(): void {
    if (!this.validate()) return;

    const id = this.editingId();
    if (id) {
      this.cuentas.update(cuentas =>
        cuentas.map(c =>
          c.id === id
            ? { ...c, nombre: this.formNombre(), tipo: this.formTipo(), saldo: this.formSaldo() }
            : c
        )
      );
    } else {
      const newId = this.cuentas().length > 0 ? Math.max(...this.cuentas().map(c => c.id)) + 1 : 1;
      this.cuentas.update(cuentas => [
        ...cuentas,
        {
          id: newId,
          nombre: this.formNombre(),
          tipo: this.formTipo(),
          saldo: this.formSaldo(),
          estatus: 'activa'
        }
      ]);
    }
    this.closeModal();
  }

  deleteCuenta(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      this.cuentas.update(cuentas => cuentas.filter(c => c.id !== id));
    }
  }

  toggleEstatus(id: number): void {
    this.cuentas.update(cuentas =>
      cuentas.map(c =>
        c.id === id
          ? { ...c, estatus: c.estatus === 'activa' ? 'inactiva' : 'activa' }
          : c
      )
    );
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
}
