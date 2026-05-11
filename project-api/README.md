# Node Project API

Fastify implementation of the same API surface as the Laravel project. It uses the shared MySQL and Redis services from `../../shared-services`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the service architecture, runtime topology, request flows, and data access notes.

## Stack

- Node.js 22
- Fastify 5
- MySQL 8.4 via `mysql2`
- Redis 7 via `ioredis`

## Setup

Create the local environment file:

```bash
cp .env.example .env
```

Start the shared infrastructure first:

```bash
cd ../../shared-services
docker compose up -d
```

Start the Node API:

```bash
cd ../docker-node/project-api
docker compose up -d --build
```

The container exposes the API at:

```text
http://localhost:8001
```

The service listens on port `8000` inside Docker and publishes it as host port `8001` so it can run next to the Laravel API.

## Database

Create the database and products table:

```bash
docker exec -it project_api_node npm run migrate
```

Seed 10,000 products:

```bash
docker exec -it project_api_node npm run seed:products
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/plain-ok` | Plain text health check returning `OK`. |
| GET | `/api/json-ok` | JSON health check returning `{ "ok": true }`. |
| GET | `/api/products` | Returns the first 5 products with `id`, `name`, and `price`. |
| GET | `/api/redis` | Returns the first 5 products using Redis cache key `products`. |
| GET | `/api/user` | Returns `501` because the Laravel Sanctum route has no Node equivalent yet. |

Example:

```bash
curl http://localhost:8001/api/json-ok
```

## Local Host Development

If you want to run outside Docker, install dependencies and point `.env` at host-exposed shared services:

```text
DB_HOST=127.0.0.1
DB_PORT=3307
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Then run:

```bash
npm install
npm run migrate
npm run seed:products
npm run dev
```
