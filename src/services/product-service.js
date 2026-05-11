const { pool } = require('../db/mysql');
const { getRedis } = require('../db/redis');
const { cache } = require('../config/env');

const PRODUCTS_CACHE_KEY = 'products';

async function listProducts(limit = 5) {
  const safeLimit = Number.parseInt(limit, 10);

  if (!Number.isInteger(safeLimit) || safeLimit < 1 || safeLimit > 100) {
    throw new Error('Product limit must be an integer between 1 and 100');
  }

  const [rows] = await pool.query(
    `SELECT id, name, price FROM products ORDER BY id ASC LIMIT ${safeLimit}`
  );

  return rows;
}

async function listProductsCached(limit = 5) {
  const redis = await getRedis();
  const cached = await redis.get(PRODUCTS_CACHE_KEY);

  if (cached) {
    return JSON.parse(cached);
  }

  const products = await listProducts(limit);
  await redis.set(PRODUCTS_CACHE_KEY, JSON.stringify(products), 'EX', cache.ttlSeconds);

  return products;
}

module.exports = {
  PRODUCTS_CACHE_KEY,
  listProducts,
  listProductsCached
};
