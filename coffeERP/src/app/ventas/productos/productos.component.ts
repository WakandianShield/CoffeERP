import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductoVenta, IngredienteProducto, Producto } from '../../shared/models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosVentasComponent {
  readonly categorias = ['Bebidas', 'Pastelería', 'Alimentos', 'Otros'];
  readonly unidadesUso = ['kg', 'g', 'litros', 'ml', 'piezas'];

  readonly productosInventario = signal<Producto[]>([]);

  productos = signal<ProductoVenta[]>([]);

  buscar = signal('');
  modalAbierto = signal(false);
  editando = signal<ProductoVenta | null>(null);

  nombreForm = signal('');
  precioForm = signal<number>(0);
  categoriaForm = signal('Bebidas');
  activoForm = signal(true);
  ingredienteSeleccionado = signal<number | null>(null);
  cantidadIngrediente = signal<number>(0);
  unidadIngrediente = signal('g');
  ingredientesForm = signal<IngredienteProducto[]>([]);

  readonly tamanoPagina = 5;
  paginaActual = signal(1);

  readonly productosFiltrados = computed(() => {
    const termino = this.buscar().toLowerCase();
    return this.productos().filter(p => p.nombre.toLowerCase().includes(termino));
  });

  readonly totalPaginas = computed(() => Math.ceil(this.productosFiltrados().length / this.tamanoPagina));

  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.tamanoPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.tamanoPagina);
  });

  onBuscar(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.buscar.set(valor);
    this.paginaActual.set(1);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
    }
  }

  abrirModal(producto?: ProductoVenta) {
    if (producto) {
      this.editando.set(producto);
      this.nombreForm.set(producto.nombre);
      this.precioForm.set(producto.precio);
      this.categoriaForm.set(producto.categoria);
      this.activoForm.set(producto.activo);
      this.ingredientesForm.set([...producto.ingredientes]);
    } else {
      this.editando.set(null);
      this.nombreForm.set('');
      this.precioForm.set(0);
      this.categoriaForm.set('Bebidas');
      this.activoForm.set(true);
      this.ingredientesForm.set([]);
    }
    this.ingredienteSeleccionado.set(null);
    this.cantidadIngrediente.set(0);
    this.unidadIngrediente.set('g');
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  agregarIngrediente() {
    const productoId = this.ingredienteSeleccionado();
    const cantidad = this.cantidadIngrediente();
    const unidad = this.unidadIngrediente();
    if (productoId && cantidad > 0.000) {
      const producto = this.productosInventario().find(p => p.id === productoId);
      if (producto) {
        const nuevoIngrediente: IngredienteProducto = {
          productoInventarioId: producto.id,
          productoInventarioNombre: producto.nombre,
          cantidadUsada: cantidad,
          unidadUsada: unidad
        };
        this.ingredientesForm.update(ingredientes => [...ingredientes, nuevoIngrediente]);
        this.ingredienteSeleccionado.set(null);
        this.cantidadIngrediente.set(0);
        this.unidadIngrediente.set('g');
      }
    }
  }

  eliminarIngrediente(index: number) {
    this.ingredientesForm.update(ingredientes => ingredientes.filter((_, i) => i !== index));
  }

  guardarProducto() {
    const nombre = this.nombreForm();
    const precio = this.precioForm();
    const categoria = this.categoriaForm();
    const activo = this.activoForm();
    const ingredientes = this.ingredientesForm();

    if (!nombre || precio <= 0) return;

    const editando = this.editando();
    if (editando) {
      this.productos.update(productos =>
        productos.map(p =>
          p.id === editando.id
            ? { ...p, nombre, precio, categoria, activo, ingredientes: [...ingredientes] }
            : p
        )
      );
    } else {
      const nuevoId = Math.max(...this.productos().map(p => p.id), 0) + 1;
      const nuevoProducto: ProductoVenta = {
        id: nuevoId,
        nombre,
        precio,
        categoria,
        activo,
        ingredientes: [...ingredientes]
      };
      this.productos.update(productos => [...productos, nuevoProducto]);
    }
    this.cerrarModal();
  }

  eliminarProducto(id: number) {
    this.productos.update(productos => productos.filter(p => p.id !== id));
    const totalPag = this.totalPaginas();
    if (this.paginaActual() > totalPag && totalPag > 0) {
      this.paginaActual.set(totalPag);
    }
  }
}
