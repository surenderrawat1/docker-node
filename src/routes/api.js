const { listProducts, listProductsCached } = require('../services/product-service');

async function apiRoutes(fastify) {
  fastify.get('/plain-ok', async (_request, reply) => {
    return reply.type('text/plain').send('OK');
  });

  fastify.get('/json-ok', async () => {
    return { ok: true };
  });

  fastify.get('/products', async () => {
    return listProducts(5);
  });

  fastify.get('/redis', async () => {
    return listProductsCached(5);
  });

  fastify.get('/user', async (_request, reply) => {
    return reply.code(501).send({
      message: 'Authentication is not implemented in the Node API yet.'
    });
  });
}

module.exports = apiRoutes;
