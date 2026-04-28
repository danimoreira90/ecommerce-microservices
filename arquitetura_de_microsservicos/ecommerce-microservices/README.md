# E-Commerce de Produtos Tecnológicos — Microsserviços

> **Cenário 3 — E-commerce de Produtos Tech**: alto giro de estoque, integração em tempo real com fornecedores, recomendações personalizadas, precificação dinâmica e comparação técnica de produtos.

Plataforma de e-commerce production-grade, orientada a eventos, seguindo Clean Architecture, DDD e princípios Twelve-Factor App.

## Documentação de Arquitetura

| Documento | Descrição |
|---|---|
| [C4-ARCHITECTURE.md](docs/architecture/C4-ARCHITECTURE.md) | Modelo C4 completo (Contexto, Containers, Componentes), análise CAP e Twelve-Factor |
| [C4-DIAGRAMS.md](docs/architecture/C4-DIAGRAMS.md) | Diagramas C4 em Mermaid (Context, Container, Component, Sequência) |
| [ADR-001 — Apache Kafka](docs/architecture/ADR-001-kafka-event-driven.md) | Decisão: Kafka para comunicação assíncrona entre microsserviços |
| [ADR-002 — Elasticsearch](docs/architecture/ADR-002-elasticsearch-search.md) | Decisão: Elasticsearch como motor de busca e descoberta de produtos |
| [ADR-003 — Saga Pattern](docs/architecture/ADR-003-saga-pattern.md) | Decisão: Saga por coreografia para transações distribuídas |

## Visão Geral da Arquitetura

- **Cenário:** E-commerce de Produtos Tecnológicos (Cenário 3) — alto giro, precificação dinâmica, integração com fornecedores
- **7 Bounded Contexts:** User, Product, Search, Cart, Order, Payment, Notification
- **Message Broker:** Apache Kafka (event-driven, choreography-based sagas)
- **API Gateway:** NestJS (routing, JWT validation, rate limiting)
- **Observability:** OpenTelemetry, Jaeger, Prometheus, Grafana

## Repository Layout

```
ecommerce-microservices/
├── services/          # NestJS microservices (Clean Architecture)
├── shared/            # Events schemas, common utilities
├── api-gateway/       # NestJS API Gateway
├── infrastructure/    # Docker, Kubernetes, monitoring
├── scripts/           # Migrations, seed data
└── .github/workflows/ # CI/CD
```

## Quick Start (Local)

1. **Prerequisites:** Node 20+, Docker, Docker Compose
2. **Install dependencies:** `npm install`
3. **Start infrastructure:** `npm run docker:up` (from repo root; run from `infrastructure/docker` if path differs)
4. **Configure:** Copy `.env.example` to `.env` in root and each service; set secrets
5. **Run migrations:** `npm run migrate:all`
6. **Start services:** From each service dir: `npm run start:dev`

## Services & Ports (Docker Compose)

| Service              | Port | Database / Cache      |
|----------------------|------|------------------------|
| API Gateway          | 8080 | -                      |
| User Service         | 3001 | PostgreSQL, Redis      |
| Product Service      | 3002 | PostgreSQL, Redis       |
| Search Service       | 3003 | Elasticsearch          |
| Cart Service         | 3004 | Redis, PostgreSQL      |
| Order Service        | 3005 | PostgreSQL             |
| Payment Service      | 3006 | PostgreSQL, Redis       |
| Notification Service | 3007 | PostgreSQL             |

## API Conventions

- Base path: `/api/v1/<context>`
- Auth: `Authorization: Bearer <JWT>`
- Correlation: `x-correlation-id` (forward or auto-generated)
- Idempotency: `Idempotency-Key` header for state-changing operations where applicable

## Definition of Done (per service)

- [ ] Unit tests (>70% coverage)
- [ ] Integration tests with real DB/broker
- [ ] E2E tests via API
- [ ] OpenTelemetry tracing
- [ ] Structured logs with correlation ID
- [ ] Health: `/health/live`, `/health/ready`
- [ ] Dockerfile + runs in Compose
- [ ] README: APIs, events, env vars, local setup
- [ ] No secrets in code; input validation; graceful shutdown

## License

Proprietary. All rights reserved.
