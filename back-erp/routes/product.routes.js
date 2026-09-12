const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const productoService = require('../services/producto.services');

// ESTA RUTA CONTROLA LAS PETICIONES DE PRODUCTOS.
const router = express.Router();
const carpetaImagenes = path.join(__dirname, '..', 'uploads', 'productos');
fs.mkdirSync(carpetaImagenes, { recursive: true });

// ESTA CONFIGURACION GUARDA LAS IMAGENES EN LA CARPETA DE PRODUCTOS.
const almacenamiento = multer.diskStorage({
	destination: carpetaImagenes,
	filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const subirImagen = multer({ storage: almacenamiento, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith('image/')) });

// ESTA FUNCION LEE LOS DATOS ENVIADOS DESDE EL FORMULARIO.
function leerProducto(req) {
	return {
		nombre: req.body.nombre,
		precio: Number(req.body.precio),
		categoria: req.body.categoria || 'Otros',
		activo: req.body.activo !== 'false',
		ingredientes: JSON.parse(req.body.ingredientes || '[]'),
		imagen: req.file ? `/uploads/productos/${req.file.filename}` : null
	};
}

router.get('/', (_req, res) => productoService.obtenerProductos((error, productos) => {
	// ESTA RUTA DEVUELVE LA LISTA DE PRODUCTOS.
	if (error) return res.status(500).json({ mensaje: 'Error al consultar productos' });
	res.json(productos);
}));

router.post('/', subirImagen.single('imagen'), (req, res) => {
	// ESTA RUTA CREA EL PRODUCTO Y GUARDA LA IMAGEN.
	let producto;
	try { producto = leerProducto(req); } catch (_error) { return res.status(400).json({ mensaje: 'Los ingredientes no tienen un formato válido' }); }
	if (!producto.nombre || !Number.isFinite(producto.precio) || producto.precio <= 0) return res.status(400).json({ mensaje: 'Nombre y precio son obligatorios' });
	productoService.crearProducto(producto, (error, creado) => {
		if (error) return res.status(500).json({ mensaje: 'Error al crear producto' });
		res.status(201).json(creado);
	});
});

router.put('/:id', subirImagen.single('imagen'), (req, res) => {
	// ESTA RUTA ACTUALIZA EL PRODUCTO Y SU IMAGEN SI SE ENVIA UNA NUEVA.
	let producto;
	try { producto = leerProducto(req); } catch (_error) { return res.status(400).json({ mensaje: 'Los ingredientes no tienen un formato válido' }); }
	productoService.actualizarProducto(req.params.id, producto, (error, actualizado) => {
		if (error) return res.status(500).json({ mensaje: 'Error al actualizar producto' });
		res.json(actualizado);
	});
});

router.delete('/:id', (req, res) => productoService.eliminarProducto(req.params.id, (error) => {
	// ESTA RUTA ELIMINA EL PRODUCTO SELECCIONADO.
	if (error) return res.status(500).json({ mensaje: 'Error al eliminar producto' });
	res.status(204).send();
}));

module.exports = router;
