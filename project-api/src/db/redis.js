const Redis = require('ioredis');
const { redis } = require('../config/env');

const client = new Redis({
  host: redis.host,
  port: redis.port,
  password: redis.password,
  db: redis.db,
  lazyConnect: true,
  maxRetriesPerRequest: 2
});

async function getRedis() {
  if (client.status === 'wait') {
    await client.connect();
  }

  return client;
}

async function closeRedis() {
  if (client.status === 'end' || client.status === 'wait') {
    return;
  }

  if (client.status === 'ready') {
    await client.quit();
    return;
  }

  client.disconnect();
}

module.exports = {
  getRedis,
  closeRedis
};
