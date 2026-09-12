// ESTE COMPONENTE MUESTRA Y ADMINISTRA LOS PRODUCTOS DE VENTA.
import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductoVenta, IngredienteProducto, Producto } from '../../shared/models';
import { ProductoService } from '../../shared/services/producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosVentasComponent implements OnInit {
  // ESTAS OPCIONES SE USAN EN EL FORMULARIO DE PRODUCTOS.
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
  imagenSeleccionada = signal<File | null>(null);
  guardando = signal(false);

  constructor(private readonly productoService: ProductoService) {}

  // ESTA FUNCION CARGA LOS PRODUCTOS CUANDO ABRE LA PANTALLA.
  ngOnInit(): void {
    this.productoService.obtenerProductos().subscribe({
      next: datos => this.productos.set(datos),
      error: error => console.error('Error al obtener productos:', error)
    });
  }

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
	// ESTA FUNCION ABRE EL FORMULARIO PARA CREAR O EDITAR.
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
    this.imagenSeleccionada.set(null);
    this.ingredienteSeleccionado.set(null);
    this.cantidadIngrediente.set(0);
    this.unidadIngrediente.set('g');
    this.modalAbierto.set(true);
  }

  seleccionarImagen(event: Event): void {
	// ESTA FUNCION GUARDA LA IMAGEN SELECCIONADA EN EL FORMULARIO.
    const input = event.target as HTMLInputElement;
    this.imagenSeleccionada.set(input.files?.[0] || null);
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
	// ESTA FUNCION ENVIA EL PRODUCTO Y LA IMAGEN AL BACKEND.
    const nombre = this.nombreForm();
    const precio = this.precioForm();
    const categoria = this.categoriaForm();
    const activo = this.activoForm();
    const ingredientes = this.ingredientesForm();

    if (!nombre || precio <= 0) return;

    const datos = { nombre, precio, categoria, activo, ingredientes: [...ingredientes] };
    const editando = this.editando();
    this.guardando.set(true);
    const peticion = editando
      ? this.productoService.actualizarProducto(editando.id, datos, this.imagenSeleccionada())
      : this.productoService.crearProducto(datos, this.imagenSeleccionada());
    peticion.subscribe({
      next: producto => {
        if (editando) this.productos.update(productos => productos.map(actual => actual.id === producto.id ? producto : actual));
        else this.productos.update(productos => [producto, ...productos]);
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: error => {
        this.guardando.set(false);
        console.error('Error al guardar producto:', error);
      }
    });
  }

  eliminarProducto(id: number) {
    this.productoService.eliminarProducto(id).subscribe({
      next: () => {
        this.productos.update(productos => productos.filter(p => p.id !== id));
        const totalPag = this.totalPaginas();
        if (this.paginaActual() > totalPag && totalPag > 0) this.paginaActual.set(totalPag);
      },
      error: error => console.error('Error al eliminar producto:', error)
    });
  }
}
