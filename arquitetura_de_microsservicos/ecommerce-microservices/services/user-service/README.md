# User Service

Identity & Access bounded context: registration, authentication, profile, email verification.

## APIs

- `POST /api/v1/users/register` — Register (body: email, password, firstName, lastName)
- `POST /api/v1/users/login` — Login (body: email, password)
- `GET /api/v1/users/:userId` — Get profile (JWT required)
- `PUT /api/v1/users/:userId/profile` — Update profile (JWT required)
- `POST /api/v1/users/verify-email` — Verify email (body: token)

## Events published (Kafka topic: user-events)

- `UserRegistered` — userId, email, firstName, lastName, registeredAt
- `UserProfileUpdated` — userId, fields
- `EmailVerified` — userId, verifiedAt

## Environment

- `PORT` — default 3000
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT` (optional)
- `KAFKA_BROKERS`, `KAFKA_GROUP_ID`
- `JWT_SECRET`, `JWT_EXPIRATION`, `REFRESH_TOKEN_EXPIRATION`

## Local

```bash
npm install
# Set DB_PASSWORD and JWT_SECRET in .env
npm run migration:run
npm run start:dev
```

## Health

- `GET /health/live` — liveness
- `GET /health/ready` — readiness (DB check)
