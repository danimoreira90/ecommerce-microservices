# API Gateway

NestJS-based API Gateway: routing, correlation ID propagation. JWT validation and rate limiting to be added.

## Routes

- `/api/v1/users/*` → User Service (3001)
- `/api/v1/products/*` → Product Service (3002)
- `/api/v1/search/*` → Search Service (3003)
- `/api/v1/carts/*` → Cart Service (3004)
- `/api/v1/orders/*` → Order Service (3005)
- `/api/v1/payments/*` → Payment Service (3006)

## Env

- `GATEWAY_PORT` / `PORT`: default 8080
- `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, etc. (defaults to localhost:300x)

## Local

```bash
npm install && npm run start:dev
```
