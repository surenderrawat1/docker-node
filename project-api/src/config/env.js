const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function numberFromEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number`);
  }

  return parsed;
}

module.exports = {
  app: {
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0',
    port: numberFromEnv('PORT', 8000)
  },
  db: {
    host: process.env.DB_HOST || 'shared_mysql',
    port: numberFromEnv('DB_PORT', 3306),
    database: process.env.DB_DATABASE || 'project_api',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    connectionLimit: numberFromEnv('DB_CONNECTION_LIMIT', 10)
  },
  redis: {
    host: process.env.REDIS_HOST || 'shared_redis',
    port: numberFromEnv('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: numberFromEnv('REDIS_DB', 0)
  },
  cache: {
    ttlSeconds: numberFromEnv('CACHE_TTL_SECONDS', 60)
  }
};
