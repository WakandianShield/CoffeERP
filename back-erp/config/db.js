const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafeteria'
});

conexion.connect((error) => {
  if (error) {
    console.error('ERROR DE CONEXION A MYSQL:', error.message);
    return;
  }

  console.log('CONECTADO A MYSQL');
});

module.exports = conexion;
