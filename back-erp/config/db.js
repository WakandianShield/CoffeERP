const mysql = require("mysql2/promise");
// Las credenciales viven exclusivamente en el .env local, nunca en Git.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "coffe_erp_exam",
  connectionLimit: 10,
  decimalNumbers: true,
  timezone: "Z",
});
// Una operación de negocio se confirma completa o se revierte completa.
async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const value = await work(connection);
    await connection.commit();
    return value;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
module.exports = { pool, transaction };
