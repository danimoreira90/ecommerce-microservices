# Product Service

Catalog management: Product CRUD, inventory, SKU. Redis cache (5min TTL), Kafka events, optimistic locking.

## APIs

- **GET** `/api/v1/products` — List products (query: category, minPrice, maxPrice, limit, offset, active)
- **GET** `/api/v1/products/:id` — Get product (cached)
- **POST** `/api/v1/products` — Create product (admin, JWT + role admin)
- **PUT** `/api/v1/products/:id` — Update product (admin)
- **PUT** `/api/v1/products/:id/inventory` — Adjust inventory delta (admin)
- **DELETE** `/api/v1/products/:id` — Delete product (admin)

## Events published (Kafka topic: product-events)

- `ProductCreated` — productId, name, sku, price, stock, category
- `ProductUpdated` — productId, changes
- `InventoryAdjusted` — productId, delta, newStock, reason (RESERVED | RELEASED | ADJUSTMENT)

## Events consumed (Kafka topic: order-events)

- `OrderPlaced` → reserve inventory per item (idempotent by orderId)
- `OrderCancelled` → release inventory per item

## Environment

- `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`
- `KAFKA_BROKERS`, `KAFKA_GROUP_ID`
- `JWT_SECRET` (for admin endpoints)

## Local

```bash
npm install
# Set DB_PASSWORD, JWT_SECRET (optional for admin)
npm run migration:run
npm run start:dev
```

## Seed

```bash
npx ts-node scripts/seed-products.ts
```

## Health

- `GET /health/live` — liveness
- `GET /health/ready` — readiness (DB + Redis)
