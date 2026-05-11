const buildApp = require('./app');
const { app: appConfig } = require('./config/env');

async function main() {
  const app = buildApp();

  try {
    await app.listen({
      host: appConfig.host,
      port: appConfig.port
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

main();
