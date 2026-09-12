const express = require('express');
const usuarioService = require('../services/usuario.services');

// ESTA RUTA CONTROLA LAS PETICIONES DE USUARIOS.
const router = express.Router();

router.get('/', (_req, res) => {
  // ESTA RUTA DEVUELVE LOS USUARIOS REGISTRADOS.
  usuarioService.obtenerUsuarios((error, usuarios) => {
    if (error) return res.status(500).json({ mensaje: 'Error al consultar usuarios' });
    res.json(usuarios);
  });
});

router.post('/registro', (req, res) => {
  // ESTA RUTA REGISTRA UN USUARIO SIN USAR JWT NI HASH.
  const { email, password, roles = [], active = true } = req.body;
  if (!email || !password || !Array.isArray(roles)) {
    return res.status(400).json({ mensaje: 'Correo, contraseña y roles son obligatorios' });
  }
  usuarioService.crearUsuario({ email, password, roles, active }, (error, usuario) => {
    if (error) return res.status(500).json({ mensaje: 'Error al registrar usuario' });
    res.status(201).json(usuario);
  });
});

router.post('/login', (req, res) => {
  // ESTA RUTA COMPRUEBA EL CORREO Y LA CONTRASENA DEL USUARIO.
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
  usuarioService.iniciarSesion(email, password, (error, usuario) => {
    if (error) return res.status(500).json({ mensaje: 'Error al iniciar sesión' });
    if (!usuario) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    res.json({ mensaje: 'Inicio de sesión exitoso', usuario });
  });
});

module.exports = router;
