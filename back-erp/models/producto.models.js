class Producto {
	// ESTE MODELO REPRESENTA LOS DATOS QUE TIENE UN PRODUCTO.
  constructor(id, nombre, precio, categoria, activo, ingredientes, imagen) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.categoria = categoria || 'Otros';
    this.activo = Boolean(activo);
    this.ingredientes = ingredientes || [];
    this.imagen = imagen || null;
  }
}

module.exports = Producto;
