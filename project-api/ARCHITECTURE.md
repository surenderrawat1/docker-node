# Architecture

This document describes the architecture of the Node Project API.

## Overview

Node Project API is a Fastify service that exposes a small HTTP API backed by MySQL and Redis. It is designed to run in Docker alongside shared infrastructure services and mirrors the API surface of the related Laravel project where possible.

```text
Client
  |
  v
Fastify app
  |
  +-- /api/plain-ok
  +-- /api/json-ok
  +-- /api/products ------> MySQL products table
  +-- /api/redis ---------> Redis cache -> MySQL products table on cache miss
  +-- /api/user ----------> 501 not implemented
```

## Technology Stack

- Node.js 22
- Fastify 5 for HTTP routing
- `@fastify/cors` for CORS support
- MySQL 8.4 via `mysql2/promise`
- Redis 7 via `ioredis`
- Docker and Docker Compose for local containerized runtime

## Runtime Topology

The API runs as a single Docker service named `project_api_node`.

```text
Host port 8001
  |
  v
project_api_node container
  |
  +-- listens on container port 8000
  +-- joins external Docker network shared_network
  +-- connects to shared_mysql:3306
  +-- connects to shared_redis:6379
```

The MySQL and Redis services are expected to exist outside this repository in the shared services environment. The API container joins the external `shared_network` network so it can resolve `shared_mysql` and `shared_redis` by service name.

## Source Layout

```text
project-api/
  Dockerfile
  docker-compose.yml
  package.json
  README.md
  scripts/
    migrate.js
    seed-products.js
  src/
    app.js
    server.js
    config/
      env.js
    db/
      mysql.js
      redis.js
    routes/
      api.js
    services/
      product-service.js
```

## Application Layers

### Entry Point

`src/server.js` is the executable entry point. It builds the Fastify app and starts listening using host and port values from `src/config/env.js`.

### App Factory

`src/app.js` creates the Fastify instance, registers CORS, registers API routes under `/api`, defines the root health response, and closes MySQL and Redis connections during Fastify shutdown.

### Routes

`src/routes/api.js` contains the public HTTP route definitions:

| Route | Responsibility |
| --- | --- |
| `GET /api/plain-ok` | Plain text health check. |
| `GET /api/json-ok` | JSON health check. |
| `GET /api/products` | Returns the first five products from MySQL. |
| `GET /api/redis` | Returns products from Redis cache, falling back to MySQL on cache miss. |
| `GET /api/user` | Returns `501` because authentication is not implemented yet. |

Routes stay thin and delegate product data access to the service layer.

### Services

`src/services/product-service.js` owns product retrieval behavior.

- `listProducts(limit)` validates the limit and queries MySQL for products ordered by `id`.
- `listProductsCached(limit)` checks Redis key `products`; on a hit it returns cached JSON, and on a miss it queries MySQL then stores the result in Redis with the configured TTL.

### Data Access

`src/db/mysql.js` creates a shared MySQL connection pool using environment configuration. The pool is reused by services and scripts.

`src/db/redis.js` creates a shared Redis client with lazy connection enabled. The client connects only when a cached route first needs Redis.

## Configuration

Configuration is loaded from `.env` by `src/config/env.js`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime environment label. |
| `HOST` | `0.0.0.0` | Fastify bind host. |
| `PORT` | `8000` | Fastify bind port inside the container. |
| `DB_HOST` | `shared_mysql` | MySQL host. |
| `DB_PORT` | `3306` | MySQL port. |
| `DB_DATABASE` | `project_api` | MySQL database name. |
| `DB_USERNAME` | `root` | MySQL username. |
| `DB_PASSWORD` | `root` | MySQL password. |
| `DB_CONNECTION_LIMIT` | `10` | MySQL pool size. |
| `REDIS_HOST` | `shared_redis` | Redis host. |
| `REDIS_PORT` | `6379` | Redis port. |
| `REDIS_PASSWORD` | unset | Optional Redis password. |
| `REDIS_DB` | `0` | Redis database index. |
| `CACHE_TTL_SECONDS` | `60` | Product cache lifetime. |

Numeric values are parsed and validated during startup. Invalid numeric configuration causes the process to throw an error.

## Data Model

The API currently uses one table:

```sql
CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

The product list endpoints return `id`, `name`, and `price`.

## Request Flows

### `GET /api/products`

```text
Client
  -> Fastify route /api/products
  -> product-service.listProducts(5)
  -> MySQL pool query
  -> JSON response
```

### `GET /api/redis`

```text
Client
  -> Fastify route /api/redis
  -> product-service.listProductsCached(5)
  -> Redis GET products
     -> cache hit: parse cached JSON and return
     -> cache miss: query MySQL, Redis SET products with TTL, return products
```

## Database Scripts

### Migration

`scripts/migrate.js` creates the configured database if needed, then creates the `products` table if it does not already exist.

Run it inside Docker:

```bash
docker exec -it project_api_node npm run migrate
```

### Seed

`scripts/seed-products.js` truncates the `products` table and inserts 10,000 generated products in batches of 500.

Run it inside Docker:

```bash
docker exec -it project_api_node npm run seed:products
```

## Caching Strategy

The Redis cache currently uses one key:

| Key | Value | TTL |
| --- | --- | --- |
| `products` | JSON encoded product list | `CACHE_TTL_SECONDS` |

The cache key does not include the requested limit. This is acceptable while the route always requests five products, but should be revisited if product routes become parameterized.

## Shutdown Behavior

Fastify's `onClose` hook closes external resources:

- Redis is quit when ready, disconnected otherwise, and ignored if it was never connected.
- MySQL pool is ended through `pool.end()`.

## Current Limitations

- Authentication is not implemented; `/api/user` intentionally returns `501`.
- Product reads are limited to the first five products through the current routes.
- There is no automated test suite yet.
- Cache invalidation is time-based only.
- Migration scripts are simple JavaScript scripts rather than a full migration framework.

