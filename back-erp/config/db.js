const mysql = require('mysql2');

// ESTA CONFIGURACION USA DIRECTAMENTE LOS DATOS DE MYSQL DE RAILWAY.
const conexion = mysql.createConnection({
  host: 'altaria.proxy.rlwy.net',
  port: 49187,
  user: 'root',
  password: 'CNPfGOYVHDsNGwABlVpHhXEiYnwseqLK',
  database: 'railway'
});

// ESTE BLOQUE COMPRUEBA LA CONEXION CON LA BASE DE DATOS.
conexion.connect((error) => {
  if (error) {
    console.error('ERROR DE CONEXION A MYSQL:', error.message);
    return;
  }

  console.log('CONECTADO A MYSQL');
});

module.exports = conexion;
