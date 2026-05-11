const { pool, closeMysql } = require('../src/db/mysql');

const TOTAL_PRODUCTS = 10000;
const BATCH_SIZE = 500;

function randomPrice() {
  return Math.floor(Math.random() * 901) + 100;
}

async function main() {
  await pool.query('TRUNCATE TABLE products');

  for (let offset = 0; offset < TOTAL_PRODUCTS; offset += BATCH_SIZE) {
    const values = [];

    for (let index = 1; index <= BATCH_SIZE && offset + index <= TOTAL_PRODUCTS; index += 1) {
      const productNumber = offset + index;
      values.push([`Product ${productNumber}`, randomPrice()]);
    }

    await pool.query('INSERT INTO products (name, price) VALUES ?', [values]);
  }

  console.log(`Seeded ${TOTAL_PRODUCTS} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMysql();
  });
