// ESTE COMPONENTE MUESTRA Y ADMINISTRA LAS ORDENES DE COMPRA.
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrdenCompra, DetalleOrdenCompra, Proveedor, Producto, MovimientoInventario } from '../../shared/models';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './ordenes.component.html',
  styleUrl: './ordenes.component.css'
})
export class OrdenesComponent {
  showModal = signal(false);
  editingId = signal<number | null>(null);
  formProveedorId = signal(0);
  formSolicitante = signal('');
  formAutorizador = signal('');
  formDetalle = signal<DetalleOrdenCompra[]>([{ producto: '', cantidad: 1, precioUnitario: 0, cantidadRecibida: 0 }]);
  errors = signal<Record<string, string>>({});

  empleados = signal<string[]>([]);

  proveedores = signal<Proveedor[]>([]);

  activeProveedores = computed(() => this.proveedores().filter(p => p.activo));

  selectedProveedor = computed(() => {
    const id = this.formProveedorId();
    return this.proveedores().find(p => p.id === id) || null;
  });

  selectedProducts = computed(() => {
    const prov = this.selectedProveedor();
    return prov ? prov.productos : [];
  });

  stock = signal<Producto[]>([]);

  movimientos = signal<MovimientoInventario[]>([]);

  ordenes = signal<OrdenCompra[]>([]);

  computedTotal = computed(() => {
    return this.formDetalle().reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  });

  openModal(id?: number): void {
    this.errors.set({});
    if (id) {
      const ord = this.ordenes().find(o => o.id === id);
      if (ord) {
        this.editingId.set(id);
        this.formProveedorId.set(ord.proveedorId);
        this.formSolicitante.set(ord.solicitante);
        this.formAutorizador.set(ord.autorizador);
        this.formDetalle.set(ord.detalle.map(d => ({ ...d })));
      }
    } else {
      this.editingId.set(null);
      this.formProveedorId.set(this.activeProveedores()[0]?.id || 0);
      this.formSolicitante.set('');
      this.formAutorizador.set('');
      this.formDetalle.set([{ producto: '', cantidad: 1, precioUnitario: 0, cantidadRecibida: 0 }]);
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formProveedorId.set(0);
    this.formSolicitante.set('');
    this.formAutorizador.set('');
    this.formDetalle.set([{ producto: '', cantidad: 1, precioUnitario: 0, cantidadRecibida: 0 }]);
    this.errors.set({});
  }

  onProveedorChange(): void {
    this.formDetalle.set([{ producto: '', cantidad: 1, precioUnitario: 0, cantidadRecibida: 0 }]);
  }

  onProductoChange(index: number, nombre: string): void {
    const prov = this.selectedProveedor();
    if (!prov) return;
    const prod = prov.productos.find(p => p.nombre === nombre);
    this.formDetalle.update(list =>
      list.map((item, i) => i === index ? { ...item, producto: nombre, precioUnitario: prod ? prod.precio : 0 } : item)
    );
  }

  addRow(): void {
    this.formDetalle.update(list => [...list, { producto: '', cantidad: 1, precioUnitario: 0, cantidadRecibida: 0 }]);
  }

  removeRow(index: number): void {
    if (this.formDetalle().length > 1) {
      this.formDetalle.update(list => list.filter((_, i) => i !== index));
    }
  }

  updateCantidad(index: number, value: number): void {
    this.formDetalle.update(list =>
      list.map((item, i) => i === index ? { ...item, cantidad: value } : item)
    );
  }

  validate(): boolean {
    const errs: Record<string, string> = {};
    if (!this.formProveedorId()) {
      errs['proveedor'] = 'Seleccione un proveedor';
    }
    if (!this.formSolicitante()) {
      errs['solicitante'] = 'Seleccione un solicitante';
    }
    if (!this.formAutorizador()) {
      errs['autorizador'] = 'Seleccione un autorizador';
    } else if (this.formAutorizador() === this.formSolicitante()) {
      errs['autorizador'] = 'El autorizador debe ser diferente al solicitante';
    }
    const hasEmpty = this.formDetalle().some(d => !d.producto.trim());
    if (hasEmpty) {
      errs['detalle'] = 'Todos los productos deben tener nombre';
    }
    const hasInvalid = this.formDetalle().some(d => d.cantidad <= 0);
    if (hasInvalid) {
      errs['valores'] = 'La cantidad debe ser mayor a 0';
    }
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    const proveedor = this.proveedores().find(p => p.id === this.formProveedorId());

    const id = this.editingId();
    if (id) {
      this.ordenes.update(list =>
        list.map(o => o.id === id ? {
          ...o,
          proveedorId: this.formProveedorId(),
          proveedorNombre: proveedor?.nombre || '',
          solicitante: this.formSolicitante(),
          autorizador: this.formAutorizador(),
          detalle: this.formDetalle().map(d => ({ ...d }))
        } : o)
      );
    } else {
      const maxId = Math.max(...this.ordenes().map(o => o.id), 0);
      this.ordenes.update(list => [...list, {
        id: maxId + 1,
        proveedorId: this.formProveedorId(),
        proveedorNombre: proveedor?.nombre || '',
        solicitante: this.formSolicitante(),
        autorizador: this.formAutorizador(),
        fecha: new Date(),
        estatus: 'pendiente',
        detalle: this.formDetalle().map(d => ({ ...d }))
      }]);
    }
    this.closeModal();
  }

  aprobar(id: number): void {
    this.ordenes.update(list =>
      list.map(o => o.id === id ? { ...o, estatus: 'parcial' as const } : o)
    );
  }

  marcarRecibida(id: number): void {
    const orden = this.ordenes().find(o => o.id === id);
    if (!orden) return;

    orden.detalle.forEach(d => {
      this.stock.update(list => {
        const existing = list.find(p => p.nombre === d.producto);
        if (existing) {
          return list.map(p => p.nombre === d.producto ? { ...p, existencia: p.existencia + d.cantidad } : p);
        }
        return [...list, {
          id: Math.max(...list.map(p => p.id), 0) + 1,
          nombre: d.producto,
          categoria: 'Insumos',
          unidadMedida: 'piezas',
          stockMinimo: 10,
          stockMaximo: 200,
          puntoReorden: 30,
          existencia: d.cantidad
        }];
      });

      this.movimientos.update(list => [...list, {
        id: Math.max(...list.map(m => m.id), 0) + 1,
        productoId: 0,
        productoNombre: d.producto,
        almacen: 'Almacén Principal',
        tipo: 'entrada',
        cantidad: d.cantidad,
        fecha: new Date()
      }]);
    });

    this.ordenes.update(list =>
      list.map(o => o.id === id ? { ...o, estatus: 'recibida' as const } : o)
    );

    alert(`Productos de OC #${id} agregados al stock exitosamente`);
  }

  cancelar(id: number): void {
    this.ordenes.update(list =>
      list.map(o => o.id === id ? { ...o, estatus: 'cancelada' as const } : o)
    );
  }

  getOrderTotal(orden: OrdenCompra): number {
    return orden.detalle.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
  }

  getEstatusClass(estatus: string): string {
    return estatus;
  }
}
