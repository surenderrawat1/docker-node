const Fastify = require('fastify');
const cors = require('@fastify/cors');
const apiRoutes = require('./routes/api');
const { closeMysql } = require('./db/mysql');
const { closeRedis } = require('./db/redis');

function buildApp(options = {}) {
  const app = Fastify({
    logger: options.logger ?? true
  });

  app.register(cors);
  app.register(apiRoutes, { prefix: '/api' });

  app.get('/', async () => {
    return {
      name: 'project-api-node',
      framework: 'Fastify',
      ok: true
    };
  });

  app.addHook('onClose', async () => {
    await closeRedis();
    await closeMysql();
  });

  return app;
}

module.exports = buildApp;
