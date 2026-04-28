# Serviço Alvo de Deploy: user-service

## Visão Geral

O `user-service` é o microsserviço escolhido como alvo para o pipeline completo de DevOps.
Trata-se do serviço mais completo do repositório, com 63 arquivos, implementando autenticação JWT,
registro de usuários e verificação de e-mail, seguindo arquitetura limpa (Clean Architecture) com NestJS 10.

## Tecnologias

| Componente    | Tecnologia                     |
|---------------|-------------------------------|
| Runtime       | Node.js 20 + NestJS 10        |
| Linguagem     | TypeScript 5 (strict)         |
| Banco de dados| PostgreSQL 16 (TypeORM 0.3)   |
| Cache         | Redis 7                       |
| Mensageria    | Kafka (KafkaJS)               |
| Autenticação  | JWT + Passport                |
| ORM           | TypeORM                       |

## Porta e Protocolo

- **Porta padrão**: `3000` (configurável via variável `PORT`)
- **Protocolo**: HTTP/1.1 REST

## Endpoints HTTP

| Método | Rota                              | Autenticação | Descrição                     |
|--------|-----------------------------------|--------------|-------------------------------|
| POST   | `/api/v1/users/register`          | Nenhuma      | Cadastro de novo usuário      |
| POST   | `/api/v1/users/login`             | Nenhuma      | Login e emissão de JWT        |
| POST   | `/api/v1/users/verify-email`      | Nenhuma      | Verificação de e-mail         |
| GET    | `/api/v1/users/:userId`           | JWT Bearer   | Buscar perfil do usuário      |
| PUT    | `/api/v1/users/:userId/profile`   | JWT Bearer   | Atualizar perfil do usuário   |
| GET    | `/health/live`                    | Nenhuma      | Liveness probe (Kubernetes)   |
| GET    | `/health/ready`                   | Nenhuma      | Readiness probe (verifica DB) |
| GET    | `/metrics`                        | Nenhuma      | Métricas Prometheus (prom-client) |

> `/metrics` foi adicionado durante este projeto para integração com Prometheus.

## Variáveis de Ambiente

| Variável                  | Padrão               | Obrigatória | Descrição                          |
|---------------------------|----------------------|-------------|------------------------------------|
| `PORT`                    | `3000`               | Não         | Porta HTTP do serviço              |
| `DB_HOST`                 | `localhost`          | Não         | Host do PostgreSQL                 |
| `DB_PORT`                 | `5432`               | Não         | Porta do PostgreSQL                |
| `DB_NAME`                 | `user_service`       | Não         | Nome do banco de dados             |
| `DB_USER`                 | `postgres`           | Não         | Usuário do PostgreSQL              |
| `DB_PASSWORD`             | —                    | **Sim**     | Senha do PostgreSQL                |
| `REDIS_HOST`              | `localhost`          | Não         | Host do Redis                      |
| `REDIS_PORT`              | `6379`               | Não         | Porta do Redis                     |
| `KAFKA_BROKERS`           | `localhost:9092`     | Não         | Lista de brokers Kafka (vírgula)   |
| `KAFKA_GROUP_ID`          | `user-service-group` | Não         | ID do consumer group Kafka         |
| `JWT_SECRET`              | —                    | **Sim**     | Segredo de assinatura JWT          |
| `JWT_EXPIRATION`          | `15m`                | Não         | Tempo de expiração do access token |
| `REFRESH_TOKEN_EXPIRATION`| `7d`                 | Não         | Tempo de expiração do refresh token|
| `NODE_ENV`                | `development`        | Não         | Ambiente de execução               |

## Estrutura de Diretórios

```
services/user-service/
├── src/
│   ├── application/
│   │   ├── services/       # AuthTokenService
│   │   └── use-cases/      # RegisterUser, LoginUser, VerifyEmail
│   ├── domain/
│   │   ├── entities/       # User (aggregate root)
│   │   ├── events/         # UserRegistered, EmailVerified
│   │   ├── repositories/   # Interface IUserRepository
│   │   └── value-objects/  # Email, Password
│   ├── infrastructure/
│   │   ├── config/         # environment.config.ts
│   │   ├── database/       # TypeORM entity, migrations, repository
│   │   └── messaging/      # KafkaProducerService
│   └── presentation/
│       ├── controllers/    # AuthController, UserController, HealthController
│       ├── dto/            # RegisterUserRequestDto
│       └── filters/        # AllExceptionsFilter
```

## Probes do Kubernetes

| Probe         | Rota            | Método |
|---------------|-----------------|--------|
| Liveness      | `/health/live`  | GET    |
| Readiness     | `/health/ready` | GET    |
| Métricas      | `/metrics`      | GET    |

## Motivo da Escolha

O `user-service` foi selecionado por ser o microsserviço com a implementação mais completa:
63 arquivos contra 12 dos outros serviços. Possui domínio rico, casos de uso implementados,
repositório TypeORM, integração Kafka, guards JWT, filtros de exceção e health controller funcional —
tudo o que é necessário para demonstrar um pipeline DevOps realista.
