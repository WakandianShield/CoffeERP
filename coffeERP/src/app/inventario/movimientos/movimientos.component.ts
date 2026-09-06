import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Movimiento {
  id: number;
  fecha: string;
  producto: string;
  almacen: string;
  tipo: string;
  cantidad: number;
  existenciaActual: number;
}

interface StockRef {
  producto: string;
  almacen: string;
  existencia: number;
}

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.css'
})
export class MovimientosComponent {
  showModal = signal(false);
  searchQuery = signal('');
  filterTipo = signal('');
  filterFechaInicio = signal('');
  filterFechaFin = signal('');

  formProducto = signal('');
  formAlmacen = signal('Almacén Principal');
  formTipo = signal('entrada');
  formCantidad = signal(0);
  formError = signal('');

  movimientos = signal<Movimiento[]>([]);

  stockRef = signal<StockRef[]>([]);

  productos = computed(() => this.stockRef().map(s => s.producto));
  almacenes = ['Almacén Principal', 'Almacén Secundario', 'Almacén de Respaldo'];
  tipos = ['entrada', 'salida'];

  filteredMovimientos = computed(() => {
    let result = this.movimientos();
    const query = this.searchQuery().toLowerCase();
    const tipo = this.filterTipo();
    const inicio = this.filterFechaInicio();
    const fin = this.filterFechaFin();

    if (query) {
      result = result.filter(m =>
        m.producto.toLowerCase().includes(query) ||
        m.almacen.toLowerCase().includes(query)
      );
    }

    if (tipo) {
      result = result.filter(m => m.tipo === tipo);
    }

    if (inicio) {
      result = result.filter(m => m.fecha >= inicio);
    }

    if (fin) {
      result = result.filter(m => m.fecha <= fin);
    }

    return result;
  });

  openCreateModal(): void {
    this.formProducto.set(this.productos()[0] || '');
    this.formAlmacen.set('Almacén Principal');
    this.formTipo.set('entrada');
    this.formCantidad.set(0);
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  getAvailableStock(): number {
    const ref = this.stockRef().find(
      s => s.producto === this.formProducto() && s.almacen === this.formAlmacen()
    );
    return ref ? ref.existencia : 0;
  }

  validateForm(): boolean {
    if (!this.formProducto()) {
      this.formError.set('Seleccione un producto');
      return false;
    }
    if (!Number.isInteger(this.formCantidad()) || this.formCantidad() <= 0) {
      this.formError.set('La cantidad debe ser un entero mayor a 0');
      return false;
    }
    if (this.formTipo() === 'salida') {
      const available = this.getAvailableStock();
      if (this.formCantidad() > available) {
        this.formError.set(`Stock insuficiente. Disponible: ${available}`);
        return false;
      }
    }
    this.formError.set('');
    return true;
  }

  saveMovimiento(): void {
    if (!this.validateForm()) return;

    const maxId = this.movimientos().length > 0
      ? Math.max(...this.movimientos().map(m => m.id))
      : 0;

    const today = new Date().toISOString().split('T')[0];
    const qty = this.formCantidad();
    const currentStock = this.getAvailableStock();
    const newStock = this.formTipo() === 'entrada'
      ? currentStock + qty
      : currentStock - qty;

    this.movimientos.update(items => [
      ...items,
      {
        id: maxId + 1,
        fecha: today,
        producto: this.formProducto(),
        almacen: this.formAlmacen(),
        tipo: this.formTipo(),
        cantidad: qty,
        existenciaActual: newStock
      }
    ]);

    this.stockRef.update(refs =>
      refs.map(s =>
        s.producto === this.formProducto() && s.almacen === this.formAlmacen()
          ? { ...s, existencia: newStock }
          : s
      )
    );

    this.closeModal();
  }

  deleteMovimiento(id: number): void {
    this.movimientos.update(items => items.filter(m => m.id !== id));
  }
}
