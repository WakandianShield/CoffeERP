import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProductoVenta } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  // ESTA ES LA DIRECCION DE LA API DE PRODUCTOS.
  private readonly api = 'http://localhost:3200/api/productos';
  private readonly apiBase = 'http://localhost:3200';

  constructor(private readonly http: HttpClient) {}

  // ESTA FUNCION OBTIENE LOS PRODUCTOS DESDE EL BACKEND.
  obtenerProductos(): Observable<ProductoVenta[]> {
    return this.http.get<ProductoVenta[]>(this.api).pipe(
      map(productos => productos.map(producto => this.normalizarImagen(producto)))
    );
  }

  // ESTA FUNCION ENVIA LOS DATOS Y LA IMAGEN PARA CREAR UN PRODUCTO.
  crearProducto(producto: Omit<ProductoVenta, 'id' | 'imagen'>, imagen: File | null): Observable<ProductoVenta> {
    return this.http.post<ProductoVenta>(this.api, this.crearFormData(producto, imagen)).pipe(
      map(productoCreado => this.normalizarImagen(productoCreado))
    );
  }

  // ESTA FUNCION ACTUALIZA LOS DATOS Y LA IMAGEN DEL PRODUCTO.
  actualizarProducto(id: number, producto: Omit<ProductoVenta, 'id' | 'imagen'>, imagen: File | null): Observable<ProductoVenta> {
    return this.http.put<ProductoVenta>(`${this.api}/${id}`, this.crearFormData(producto, imagen)).pipe(
      map(productoActualizado => this.normalizarImagen(productoActualizado))
    );
  }

  // ESTA FUNCION ELIMINA UN PRODUCTO DESDE EL BACKEND.
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // ESTA FUNCION PREPARA EL FORMULARIO PARA ENVIAR TEXTO E IMAGEN.
  private crearFormData(producto: Omit<ProductoVenta, 'id' | 'imagen'>, imagen: File | null): FormData {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('precio', String(producto.precio));
    formData.append('categoria', producto.categoria);
    formData.append('activo', String(producto.activo));
    formData.append('ingredientes', JSON.stringify(producto.ingredientes));
    if (imagen) formData.append('imagen', imagen);
    return formData;
  }

  // ESTA FUNCION COMPLETA LA DIRECCION DE LA IMAGEN RECIBIDA.
  private normalizarImagen(producto: ProductoVenta): ProductoVenta {
    return {
      ...producto,
      imagen: producto.imagen && producto.imagen.startsWith('/')
        ? `${this.apiBase}${producto.imagen}`
        : producto.imagen || null
    };
  }
}
