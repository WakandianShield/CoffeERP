const db = require('../config/db');

// ESTA FUNCION PREPARA LOS DATOS DEL USUARIO PARA EL FRONTEND.
function convertirUsuario(usuario) {
  return {
    id: usuario.id,
    email: usuario.email,
    password: usuario.password,
    roles: typeof usuario.roles === 'string' ? JSON.parse(usuario.roles || '[]') : usuario.roles || [],
    createdAt: usuario.created_at || usuario.createdAt,
    active: Boolean(usuario.active)
  };
}

function obtenerUsuarios(callback) {
  // ESTA CONSULTA OBTIENE LOS USUARIOS REGISTRADOS.
  db.query('SELECT id, email, password, roles, created_at, active FROM usuarios ORDER BY id DESC', (error, resultados) => {
    if (error) return callback(error, null);
    callback(null, resultados.map(convertirUsuario));
  });
}

function crearUsuario(usuario, callback) {
  // ESTA CONSULTA REGISTRA UN USUARIO NUEVO.
  const sql = 'INSERT INTO usuarios (email, password, roles, active) VALUES (?, ?, ?, ?)';
  const valores = [usuario.email, usuario.password, JSON.stringify(usuario.roles || []), usuario.active ? 1 : 0];
  db.query(sql, valores, (error, resultado) => {
    if (error) return callback(error, null);
    callback(null, { id: resultado.insertId, ...usuario });
  });
}

function iniciarSesion(email, password, callback) {
  // ESTA CONSULTA BUSCA UN USUARIO CON EL CORREO Y LA CONTRASENA RECIBIDOS.
  db.query('SELECT id, email, password, roles, created_at, active FROM usuarios WHERE email = ? AND password = ? AND active = 1 LIMIT 1', [email, password], (error, resultados) => {
    if (error) return callback(error, null);
    callback(null, resultados.length ? convertirUsuario(resultados[0]) : null);
  });
}

module.exports = { obtenerUsuarios, crearUsuario, iniciarSesion };
