// ESTE COMPONENTE MUESTRA Y ADMINISTRA LOS PROVEEDORES.
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Proveedor, ProductoProveedor } from '../../shared/models';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent {
  searchTerm = signal('');
  currentPage = signal(1);
  itemsPerPage = signal(5);
  showModal = signal(false);
  editingId = signal<number | null>(null);
  formNombre = signal('');
  formTelefono = signal('');
  formCorreo = signal('');
  formRfc = signal('');
  formActivo = signal(true);
  errors = signal<Record<string, string>>({});

  showProductModal = signal(false);
  editingProveedorId = signal<number | null>(null);
  editingProductIndex = signal<number | null>(null);
  formProductoNombre = signal('');
  formProductoUnidad = signal('kg');
  formProductoCantidad = signal(1);
  formProductoPrecio = signal(0);

  proveedores = signal<Proveedor[]>([]);

  filteredProveedores = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.proveedores().filter(p =>
      p.nombre.toLowerCase().includes(term) ||
      p.correo.toLowerCase().includes(term) ||
      p.rfc.toLowerCase().includes(term)
    );
  });

  paginatedProveedores = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredProveedores().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredProveedores().length / this.itemsPerPage());
  });

  currentProveedorForProducts = computed(() => {
    const id = this.editingProveedorId();
    return this.proveedores().find(p => p.id === id) || null;
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  openModal(id?: number): void {
    this.errors.set({});
    if (id) {
      const proveedor = this.proveedores().find(p => p.id === id);
      if (proveedor) {
        this.editingId.set(id);
        this.formNombre.set(proveedor.nombre);
        this.formTelefono.set(proveedor.telefono);
        this.formCorreo.set(proveedor.correo);
        this.formRfc.set(proveedor.rfc);
        this.formActivo.set(proveedor.activo);
      }
    } else {
      this.editingId.set(null);
      this.formNombre.set('');
      this.formTelefono.set('');
      this.formCorreo.set('');
      this.formRfc.set('');
      this.formActivo.set(true);
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.formNombre.set('');
    this.formTelefono.set('');
    this.formCorreo.set('');
    this.formRfc.set('');
    this.formActivo.set(true);
    this.errors.set({});
  }

  validate(): boolean {
    const errs: Record<string, string> = {};
    if (!this.formNombre().trim()) {
      errs['nombre'] = 'El nombre es requerido';
    }
    if (!this.formTelefono()) {
      errs['telefono'] = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(this.formTelefono())) {
      errs['telefono'] = 'Debe ser 10 dígitos exactos';
    }
    if (!this.formCorreo()) {
      errs['correo'] = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formCorreo())) {
      errs['correo'] = 'Formato de correo inválido';
    }
    if (!this.formRfc()) {
      errs['rfc'] = 'El RFC es requerido';
    } else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(this.formRfc())) {
      errs['rfc'] = 'RFC inválido (ej: ABC123456XYZ)';
    }
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  save(): void {
    if (!this.validate()) return;

    const id = this.editingId();
    if (id) {
      this.proveedores.update(list =>
        list.map(p => p.id === id ? {
          ...p,
          nombre: this.formNombre(),
          telefono: this.formTelefono(),
          correo: this.formCorreo(),
          rfc: this.formRfc(),
          activo: this.formActivo()
        } : p)
      );
    } else {
      const maxId = Math.max(...this.proveedores().map(p => p.id), 0);
      this.proveedores.update(list => [...list, {
        id: maxId + 1,
        nombre: this.formNombre(),
        telefono: this.formTelefono(),
        correo: this.formCorreo(),
        rfc: this.formRfc(),
        activo: this.formActivo(),
        productos: []
      }]);
    }
    this.closeModal();
  }

  toggleActivo(id: number): void {
    this.proveedores.update(list =>
      list.map(p => p.id === id ? { ...p, activo: !p.activo } : p)
    );
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(v => v - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(v => v + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  openProductModal(proveedorId: number): void {
    this.editingProveedorId.set(proveedorId);
    this.editingProductIndex.set(null);
    this.formProductoNombre.set('');
    this.formProductoUnidad.set('kg');
    this.formProductoCantidad.set(1);
    this.formProductoPrecio.set(0);
    this.showProductModal.set(true);
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.editingProveedorId.set(null);
    this.editingProductIndex.set(null);
    this.formProductoNombre.set('');
    this.formProductoUnidad.set('kg');
    this.formProductoCantidad.set(1);
    this.formProductoPrecio.set(0);
  }

  startAddProduct(): void {
    this.editingProductIndex.set(null);
    this.formProductoNombre.set('');
    this.formProductoUnidad.set('kg');
    this.formProductoCantidad.set(1);
    this.formProductoPrecio.set(0);
  }

  startEditProduct(index: number, producto: ProductoProveedor): void {
    this.editingProductIndex.set(index);
    this.formProductoNombre.set(producto.nombre);
    this.formProductoUnidad.set(producto.unidad);
    this.formProductoCantidad.set(producto.cantidad);
    this.formProductoPrecio.set(producto.precio);
  }

  cancelProductForm(): void {
    this.editingProductIndex.set(null);
    this.formProductoNombre.set('');
    this.formProductoUnidad.set('kg');
    this.formProductoCantidad.set(1);
    this.formProductoPrecio.set(0);
  }

  saveProduct(): void {
    if (!this.formProductoNombre().trim()) return;
    if (this.formProductoCantidad() < 1) return;
    if (this.formProductoPrecio() <= 0) return;

    const proveedorId = this.editingProveedorId();
    if (!proveedorId) return;

    const nuevoProducto: ProductoProveedor = {
      nombre: this.formProductoNombre().trim(),
      unidad: this.formProductoUnidad(),
      cantidad: this.formProductoCantidad(),
      precio: this.formProductoPrecio()
    };

    const index = this.editingProductIndex();

    this.proveedores.update(list =>
      list.map(p => {
        if (p.id !== proveedorId) return p;
        const productos = [...p.productos];
        if (index !== null) {
          productos[index] = nuevoProducto;
        } else {
          productos.push(nuevoProducto);
        }
        return { ...p, productos };
      })
    );

    this.cancelProductForm();
  }

  deleteProduct(index: number): void {
    const proveedorId = this.editingProveedorId();
    if (!proveedorId) return;

    this.proveedores.update(list =>
      list.map(p => {
        if (p.id !== proveedorId) return p;
        const productos = p.productos.filter((_, i) => i !== index);
        return { ...p, productos };
      })
    );
  }
}
