// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,        // el que ves en el config, 3306
  user: 'root',      // <-- AQUÍ
  password: '',      // <-- si no tiene contraseña, déjalo vacío
  database: 'shopping_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
