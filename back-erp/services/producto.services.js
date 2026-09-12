const db = require('../config/db');

// ESTA FUNCION PREPARA LOS DATOS DEL PRODUCTO PARA ENVIARLOS AL FRONTEND.
function convertirProducto(producto) {
	return {
		...producto,
		precio: Number(producto.precio),
		activo: Boolean(producto.activo),
		ingredientes: typeof producto.ingredientes === 'string'
			? JSON.parse(producto.ingredientes || '[]')
			: producto.ingredientes || [],
		imagen: producto.imagen || null
	};
}

function obtenerProductos(callback) {
	// ESTA CONSULTA OBTIENE TODOS LOS PRODUCTOS GUARDADOS.
	const sql = 'SELECT id, nombre, precio, categoria, activo, ingredientes, imagen FROM productos ORDER BY id DESC';
	db.query(sql, (error, resultados) => {
		if (error) return callback(error, null);
		callback(null, resultados.map(convertirProducto));
	});
}

function crearProducto(producto, callback) {
	// ESTA CONSULTA GUARDA UN PRODUCTO NUEVO CON SU IMAGEN.
	const sql = 'INSERT INTO productos (nombre, precio, categoria, activo, ingredientes, imagen) VALUES (?, ?, ?, ?, ?, ?)';
	const valores = [producto.nombre, producto.precio, producto.categoria, producto.activo ? 1 : 0, JSON.stringify(producto.ingredientes || []), producto.imagen || null];
	db.query(sql, valores, (error, resultado) => {
		if (error) return callback(error, null);
		callback(null, { id: resultado.insertId, ...producto });
	});
}

function actualizarProducto(id, producto, callback) {
	// ESTA CONSULTA ACTUALIZA LOS DATOS DEL PRODUCTO.
	const sql = 'UPDATE productos SET nombre = ?, precio = ?, categoria = ?, activo = ?, ingredientes = ?, imagen = COALESCE(?, imagen) WHERE id = ?';
	const valores = [producto.nombre, producto.precio, producto.categoria, producto.activo ? 1 : 0, JSON.stringify(producto.ingredientes || []), producto.imagen || null, id];
	db.query(sql, valores, (error) => {
		if (error) return callback(error, null);
		callback(null, { id: Number(id), ...producto });
	});
}

function eliminarProducto(id, callback) {
	// ESTA CONSULTA ELIMINA UN PRODUCTO POR SU ID.
	db.query('DELETE FROM productos WHERE id = ?', [id], callback);
}

module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };
