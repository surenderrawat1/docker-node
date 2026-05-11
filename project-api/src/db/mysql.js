const mysql = require('mysql2/promise');
const { db } = require('../config/env');

const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  database: db.database,
  user: db.user,
  password: db.password,
  waitForConnections: true,
  connectionLimit: db.connectionLimit,
  namedPlaceholders: true,
  decimalNumbers: true
});

async function closeMysql() {
  await pool.end();
}

module.exports = {
  pool,
  closeMysql
};
