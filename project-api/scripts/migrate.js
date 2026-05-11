const mysql = require('mysql2/promise');
const { db } = require('../src/config/env');

async function main() {
  const serverConnection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password
  });

  await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${db.database}\``);
  await serverConnection.end();

  const connection = await mysql.createConnection({
    host: db.host,
    port: db.port,
    database: db.database,
    user: db.user,
    password: db.password
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.end();
  console.log(`Migrated database ${db.database}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
