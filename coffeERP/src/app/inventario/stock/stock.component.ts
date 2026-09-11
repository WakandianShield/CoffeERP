// ESTE COMPONENTE MUESTRA Y ADMINISTRA EL STOCK DISPONIBLE.
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface StockItem {
  id: number;
  producto: string;
  almacen: string;
  existencia: number;
  stockMinimo: number;
  stockMaximo: number;
  puntoReorden: number;
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent {
  showConfigModal = signal(false);
  configItem = signal<StockItem | null>(null);
  searchQuery = signal('');
  filterEstatus = signal('');

  configStockMinimo = signal(0);
  configStockMaximo = signal(0);
  configPuntoReorden = signal(0);
  configError = signal('');

  stockItems = signal<StockItem[]>([]);

  estatusOptions = ['Bajo', 'Normal', 'Sobre'];

  getEstatus(item: StockItem): string {
    if (item.existencia < item.stockMinimo) return 'Bajo';
    if (item.existencia > item.stockMaximo) return 'Sobre';
    return 'Normal';
  }

  totalProductos = computed(() => this.stockItems().length);

  productosBajoStock = computed(() =>
    this.stockItems().filter(i => i.existencia < i.stockMinimo).length
  );

  productosSobreStock = computed(() =>
    this.stockItems().filter(i => i.existencia > i.stockMaximo).length
  );

  valorTotalInventario = computed(() =>
    this.stockItems().reduce((sum, i) => sum + i.existencia, 0)
  );

  filteredItems = computed(() => {
    let result = this.stockItems();
    const query = this.searchQuery().toLowerCase();
    const estatus = this.filterEstatus();

    if (query) {
      result = result.filter(i =>
        i.producto.toLowerCase().includes(query) ||
        i.almacen.toLowerCase().includes(query)
      );
    }

    if (estatus) {
      result = result.filter(i => this.getEstatus(i) === estatus);
    }

    return result;
  });

  openConfigModal(item: StockItem): void {
    this.configItem.set(item);
    this.configStockMinimo.set(item.stockMinimo);
    this.configStockMaximo.set(item.stockMaximo);
    this.configPuntoReorden.set(item.puntoReorden);
    this.configError.set('');
    this.showConfigModal.set(true);
  }

  closeConfigModal(): void {
    this.showConfigModal.set(false);
    this.configItem.set(null);
  }

  validateConfig(): boolean {
    if (this.configStockMaximo() <= this.configStockMinimo()) {
      this.configError.set('El stock máximo debe ser mayor al stock mínimo');
      return false;
    }
    if (this.configPuntoReorden() < this.configStockMinimo() || this.configPuntoReorden() > this.configStockMaximo()) {
      this.configError.set('El punto de reorden debe estar entre el mínimo y máximo');
      return false;
    }
    this.configError.set('');
    return true;
  }

  saveConfig(): void {
    if (!this.validateConfig()) return;

    const item = this.configItem();
    if (item) {
      this.stockItems.update(items =>
        items.map(i =>
          i.id === item.id
            ? {
                ...i,
                stockMinimo: this.configStockMinimo(),
                stockMaximo: this.configStockMaximo(),
                puntoReorden: this.configPuntoReorden()
              }
            : i
        )
      );
    }

    this.closeConfigModal();
  }
}
