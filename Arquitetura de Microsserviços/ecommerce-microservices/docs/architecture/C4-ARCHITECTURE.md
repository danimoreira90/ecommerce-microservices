# Arquitetura C4 — E-Commerce de Produtos Tecnológicos

> **Cenário 3 — E-commerce de Produtos Tech**: alto giro de estoque, integração em tempo real com fornecedores, recomendações personalizadas, precificação dinâmica e comparação técnica de produtos.

Este documento descreve a arquitetura da plataforma nos quatro níveis do **modelo C4** (Context, Container, Component, Code), além de análises complementares de CAP Theorem e conformidade com Twelve-Factor App.

---

## Nível 1 — Diagrama de Contexto do Sistema

O diagrama de contexto mostra a plataforma como um todo, seus usuários e os sistemas externos com os quais interage.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         SISTEMAS EXTERNOS                                │
│                                                                          │
│  ┌────────────────┐   ┌────────────────┐   ┌──────────────────────────┐ │
│  │     Stripe     │   │   SendGrid /   │   │  Fornecedores de Produto │ │
│  │  (Pagamentos)  │   │  SMTP Provider │   │  (APIs de Estoque e      │ │
│  │                │   │  (E-mails)     │   │   Precificação)          │ │
│  └───────┬────────┘   └───────┬────────┘   └──────────────┬───────────┘ │
│          │                    │                            │             │
└──────────┼────────────────────┼────────────────────────────┼─────────────┘
           │                    │                            │
           ▼                    ▼                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│              PLATAFORMA E-COMMERCE DE PRODUTOS TECH                      │
│                                                                          │
│   Sistema de microsserviços para venda de produtos tecnológicos          │
│   com alto giro de estoque, busca técnica avançada, carrinho             │
│   persistente, pagamentos seguros e notificações em tempo real.          │
│                                                                          │
└────────────────────────┬──────────────────┬──────────────────────────────┘
                         │                  │
           ┌─────────────┘                  └────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                      ┌─────────────────────────────┐
│   Cliente Final      │                      │    Administrador            │
│                      │                      │                             │
│  Navega no catálogo, │                      │  Gerencia produtos,         │
│  busca produtos,     │                      │  ajusta estoque,            │
│  adiciona ao         │                      │  acompanha pedidos e        │
│  carrinho, finaliza  │                      │  monitora a plataforma.     │
│  compras e acompanha │                      │                             │
│  pedidos.            │                      │                             │
└──────────────────────┘                      └─────────────────────────────┘
```

### Atores e sistemas externos

| Ator / Sistema | Tipo | Responsabilidade na plataforma |
|---|---|---|
| **Cliente Final** | Usuário humano | Navega, busca, compara produtos, adiciona ao carrinho, realiza checkout, acompanha status de pedidos |
| **Administrador** | Usuário humano | Cadastra e atualiza produtos, ajusta preços e estoque, acessa relatórios operacionais |
| **Stripe** | Sistema externo (SaaS) | Processamento de pagamentos com cartão de crédito/débito; envio de webhooks com resultado da cobrança |
| **SendGrid / SMTP** | Sistema externo (SaaS) | Envio transacional de e-mails: confirmação de cadastro, verificação de e-mail, confirmação de pedido, notificação de envio |
| **Fornecedores de Produto** | Sistema externo | Publicam atualizações de preço, disponibilidade e especificações técnicas de produtos via integração Kafka ou API |

---

## Nível 2 — Diagrama de Containers

O diagrama de containers detalha os processos de software que compõem a plataforma, suas tecnologias e como se comunicam.

```
                         ┌────────────────────────────────────────────────────────────────────┐
                         │                    PLATAFORMA E-COMMERCE DE PRODUTOS TECH            │
                         │                                                                      │
  Cliente / Admin        │  ┌─────────────────────────────────────────────────────────────┐    │
      │                  │  │                  API GATEWAY (NestJS)                        │    │
      │ HTTPS            │  │  Porta: 8080                                                 │    │
      └─────────────────►│  │  - Roteamento de requisições para microsserviços             │    │
                         │  │  - Validação e verificação de tokens JWT                    │    │
                         │  │  - Rate limiting por IP e por usuário                       │    │
                         │  │  - Propagação de x-correlation-id                           │    │
                         │  └────────────────────────────┬────────────────────────────────┘    │
                         │                               │ HTTP/REST                            │
                         │          ┌────────────────────┴──────────────────────┐               │
                         │          │                                           │               │
                         │          ▼                                           ▼               │
                         │  ┌───────────────────┐                   ┌──────────────────────┐    │
                         │  │   USER SERVICE    │                   │   PRODUCT SERVICE    │    │
                         │  │   (NestJS)        │                   │   (NestJS)           │    │
                         │  │   Porta: 3001     │                   │   Porta: 3002        │    │
                         │  │                   │                   │                      │    │
                         │  │  - Cadastro       │                   │  - CRUD de produtos  │    │
                         │  │  - Autenticação   │                   │  - Gestão de estoque │    │
                         │  │  - Verificação    │                   │  - Cache de preços   │    │
                         │  │    de e-mail      │                   │  - Bloqueio otimista │    │
                         │  │  - JWT/Refresh    │                   │    de inventário     │    │
                         │  │                   │                   │                      │    │
                         │  │  [PostgreSQL]     │                   │  [PostgreSQL]        │    │
                         │  │  [Redis]          │                   │  [Redis - 5min TTL]  │    │
                         │  └─────────┬─────────┘                   └──────────┬───────────┘    │
                         │            │                                         │               │
                         │            │                                         │               │
                         │  ┌─────────┴──────────────────────────────┐         │               │
                         │  │                                         │         │               │
                         │  ▼                                         ▼         ▼               │
                         │  ┌───────────────────┐         ┌──────────────────────────────┐      │
                         │  │  SEARCH SERVICE   │         │       CART SERVICE           │      │
                         │  │  (NestJS)         │         │       (NestJS)               │      │
                         │  │  Porta: 3003      │         │       Porta: 3004            │      │
                         │  │                   │         │                              │      │
                         │  │  - Busca full-text│         │  - Carrinho persistente      │      │
                         │  │  - Filtros facets │         │  - TTL por sessão            │      │
                         │  │  - Autocomplete   │         │  - Snapshot de preço         │      │
                         │  │  - Comparação de  │         │  - Validação de estoque      │      │
                         │  │    produtos       │         │    no momento de adição      │      │
                         │  │  - Sinônimos tech │         │                              │      │
                         │  │                   │         │  [Redis - carrinho ativo]    │      │
                         │  │  [Elasticsearch]  │         │  [PostgreSQL - histórico]    │      │
                         │  └───────────────────┘         └──────────────────────────────┘      │
                         │                                                                      │
                         │  ┌───────────────────┐         ┌──────────────────────────────┐      │
                         │  │  ORDER SERVICE    │         │     PAYMENT SERVICE          │      │
                         │  │  (NestJS)         │         │     (NestJS)                 │      │
                         │  │  Porta: 3005      │         │     Porta: 3006              │      │
                         │  │                   │         │                              │      │
                         │  │  - Ciclo de vida  │         │  - Integração Stripe         │      │
                         │  │    do pedido      │         │  - PCI-DSS (sem dados brutos)│      │
                         │  │  - Saga orq.      │         │  - Processamento de webhooks │      │
                         │  │  - Padrão Outbox  │         │  - Reembolsos                │      │
                         │  │  - Status tracking│         │  - Idempotência              │      │
                         │  │                   │         │                              │      │
                         │  │  [PostgreSQL]     │         │  [PostgreSQL]                │      │
                         │  └─────────┬─────────┘         │  [Redis - dedup webhooks]   │      │
                         │            │                    └──────────────────────────────┘      │
                         │            │                                                         │
                         │            ▼                                                         │
                         │  ┌──────────────────────┐                                           │
                         │  │ NOTIFICATION SERVICE │                                           │
                         │  │ (NestJS)             │                                           │
                         │  │ Porta: 3007          │                                           │
                         │  │                      │                                           │
                         │  │ - Templates de e-mail│                                           │
                         │  │ - Envio via SendGrid │                                           │
                         │  │ - Histórico de envios│                                           │
                         │  │                      │                                           │
                         │  │ [PostgreSQL]         │                                           │
                         │  └──────────────────────┘                                           │
                         │                                                                      │
                         │  ═══════════════════════ INFRAESTRUTURA COMPARTILHADA ══════════════ │
                         │                                                                      │
                         │  ┌──────────────────────────────────────────────────────────────┐   │
                         │  │                  Apache Kafka (Message Broker)                │   │
                         │  │  Tópicos: user-events, product-events, order-events,         │   │
                         │  │           payment-events, cart-events, notification-events    │   │
                         │  └──────────────────────────────────────────────────────────────┘   │
                         │                                                                      │
                         │  ┌────────────────────────┐   ┌──────────────────────────────────┐  │
                         │  │  Observabilidade        │   │  Armazenamento de Dados          │  │
                         │  │  - Prometheus           │   │  - PostgreSQL 15 (por serviço)   │  │
                         │  │  - Grafana              │   │  - Redis 7                       │  │
                         │  │  - Jaeger (tracing)     │   │  - Elasticsearch 8.10.0          │  │
                         │  │  - OpenTelemetry        │   │                                  │  │
                         │  └────────────────────────┘   └──────────────────────────────────┘  │
                         │                                                                      │
                         └────────────────────────────────────────────────────────────────────┘
```

### Tabela de containers

| Container | Tecnologia | Banco de Dados | Responsabilidade principal |
|---|---|---|---|
| **API Gateway** | NestJS + TypeScript | — | Ponto de entrada único; autenticação JWT, rate limiting, roteamento |
| **User Service** | NestJS + TypeScript | PostgreSQL + Redis | Identidade e acesso: registro, login, perfil, verificação de e-mail |
| **Product Service** | NestJS + TypeScript | PostgreSQL + Redis | Catálogo: CRUD de produtos, gestão de estoque com bloqueio otimista |
| **Search Service** | NestJS + TypeScript | Elasticsearch | Busca full-text, facets, autocomplete, índice sincronizado via Kafka |
| **Cart Service** | NestJS + TypeScript | Redis + PostgreSQL | Carrinho com TTL, snapshot de preço, persistência de sessão |
| **Order Service** | NestJS + TypeScript | PostgreSQL | Ciclo de vida do pedido, saga de coreografia, padrão Outbox |
| **Payment Service** | NestJS + TypeScript | PostgreSQL + Redis | Pagamentos via Stripe, webhooks idempotentes, reembolsos |
| **Notification Service** | NestJS + TypeScript | PostgreSQL | E-mails transacionais via SendGrid/SMTP, histórico de envios |

### Protocolos de comunicação

| Tipo | Usado entre | Protocolo | Observações |
|---|---|---|---|
| **Síncrono** | Cliente ↔ API Gateway | HTTPS/REST | JWT no header Authorization |
| **Síncrono** | API Gateway ↔ Microsserviços | HTTP/REST interno | Correlation-ID propagado |
| **Assíncrono** | Microsserviços ↔ Microsserviços | Apache Kafka | At-least-once, idempotência nos consumers |
| **Síncrono externo** | Payment Service ↔ Stripe | HTTPS/REST | Idempotency-Key para retries seguros |
| **Síncrono externo** | Stripe ↔ Payment Service | HTTPS Webhook | Assinatura HMAC verificada |
| **Síncrono externo** | Notification Service ↔ SendGrid | HTTPS/REST | TLS obrigatório |

---

## Nível 3 — Diagrama de Componentes: Cart Service

O nível de componentes detalha a estrutura interna de um container. Escolhemos o **Cart Service** por ser o ponto de maior interação entre frontend, catálogo de produtos e fluxo de pedidos.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              CART SERVICE (NestJS)                               │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                      CAMADA DE APRESENTAÇÃO (HTTP)                        │   │
│  │                                                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      CartController                               │    │   │
│  │  │                                                                   │    │   │
│  │  │  POST   /api/v1/carts                  → createCart()            │    │   │
│  │  │  POST   /api/v1/carts/:id/items        → addItem()               │    │   │
│  │  │  DELETE /api/v1/carts/:id/items/:itemId → removeItem()           │    │   │
│  │  │  GET    /api/v1/carts/:id              → getCart()               │    │   │
│  │  │                                                                   │    │   │
│  │  │  [Validação via class-validator, JWT Guard, Correlation Middleware]│   │   │
│  │  └──────────────────────────────┬───────────────────────────────────┘    │   │
│  │                                 │                                         │   │
│  └─────────────────────────────────┼─────────────────────────────────────────┘   │
│                                    │                                             │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐   │
│  │                   CAMADA DE APLICAÇÃO (Use Cases)                         │   │
│  │                                 │                                         │   │
│  │  ┌──────────────────────────────▼───────────────────────────────────┐    │   │
│  │  │                       CartService                                  │    │   │
│  │  │                                                                   │    │   │
│  │  │  createCart(userId)                                               │    │   │
│  │  │    └─► CartRepository.create()                                   │    │   │
│  │  │    └─► KafkaEventPublisher.publish(CartCreated)                  │    │   │
│  │  │                                                                   │    │   │
│  │  │  addItem(cartId, productId, quantity)                             │    │   │
│  │  │    └─► PriceSnapshotService.capturePrice(productId)              │    │   │
│  │  │    └─► CartRepository.addItem(cartId, item, priceSnapshot)       │    │   │
│  │  │    └─► KafkaEventPublisher.publish(ItemAddedToCart)              │    │   │
│  │  │                                                                   │    │   │
│  │  │  removeItem(cartId, itemId)                                       │    │   │
│  │  │    └─► CartRepository.removeItem()                               │    │   │
│  │  │    └─► KafkaEventPublisher.publish(ItemRemovedFromCart)          │    │   │
│  │  │                                                                   │    │   │
│  │  │  getCart(cartId)                                                  │    │   │
│  │  │    └─► CartRepository.findById()                                 │    │   │
│  │  └────────┬──────────────────────────┬────────────────────────────┘    │   │
│  │           │                          │                                   │   │
│  └───────────┼──────────────────────────┼───────────────────────────────────┘   │
│              │                          │                                        │
│  ┌───────────┼──────────────────────────┼───────────────────────────────────┐   │
│  │                  CAMADA DE DOMÍNIO (Entidades e Regras)                   │   │
│  │           │                          │                                   │   │
│  │  ┌────────▼────────┐    ┌────────────▼────────────┐                     │   │
│  │  │  CartRepository │    │  PriceSnapshotService    │                     │   │
│  │  │                 │    │                          │                     │   │
│  │  │  Abstração de   │    │  Consulta o Product      │                     │   │
│  │  │  persistência   │    │  Service (HTTP) para     │                     │   │
│  │  │  do carrinho.   │    │  obter o preço atual     │                     │   │
│  │  │  Interface que  │    │  do produto no momento   │                     │   │
│  │  │  separa o       │    │  da adição ao carrinho.  │                     │   │
│  │  │  domínio da     │    │  Salva o preço junto     │                     │   │
│  │  │  infraestrutura │    │  ao item para proteger   │                     │   │
│  │  │                 │    │  o cliente de variações  │                     │   │
│  │  │                 │    │  de preço até o checkout.│                     │   │
│  │  └────────┬────────┘    └──────────────────────────┘                     │   │
│  │           │                                                              │   │
│  └───────────┼──────────────────────────────────────────────────────────────┘   │
│              │                                                                   │
│  ┌───────────┼──────────────────────────────────────────────────────────────┐   │
│  │               CAMADA DE INFRAESTRUTURA                                    │   │
│  │           │                                                               │   │
│  │  ┌────────▼────────────────────┐   ┌───────────────────────────────┐    │   │
│  │  │  CartRepositoryImpl         │   │  KafkaEventPublisher           │    │   │
│  │  │                             │   │                                │    │   │
│  │  │  Implementação híbrida:     │   │  Publica eventos de domínio   │    │   │
│  │  │  - Redis: carrinho ativo    │   │  no tópico cart-events:       │    │   │
│  │  │    (TTL de sessão,          │   │  - CartCreated                │    │   │
│  │  │     acesso em < 1ms)        │   │  - ItemAddedToCart            │    │   │
│  │  │  - PostgreSQL: histórico    │   │  - ItemRemovedFromCart        │    │   │
│  │  │    de carrinhos, relatórios │   │                                │    │   │
│  │  │    e auditoria              │   │  Inclui correlationId e        │    │   │
│  │  │                             │   │  eventId em todos os eventos  │    │   │
│  │  └─────────────────────────────┘   └───────────────────────────────┘    │   │
│  │                                                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Interação do Cart Service com o frontend

```
Frontend (SPA/Mobile)
       │
       │ 1. POST /api/v1/carts/:id/items
       │    { productId: "abc", quantity: 2 }
       │    Authorization: Bearer <JWT>
       ▼
  API Gateway (porta 8080)
       │ Valida JWT → extrai userId
       │ Propaga x-correlation-id
       ▼
  Cart Service (porta 3004)
       │
       ├─► 2. PriceSnapshotService → GET /api/v1/products/abc (Product Service)
       │        Retorna: { price: 2999.90, stock: 15 }
       │        Snapshot salvo: priceAtAddition = 2999.90
       │
       ├─► 3. CartRepositoryImpl.addItem()
       │        Redis: HSET cart:{cartId} items → serializado com snapshot
       │        PostgreSQL: INSERT cart_items (cartId, productId, qty, priceSnapshot)
       │
       └─► 4. KafkaEventPublisher → topic: cart-events
                Evento: ItemAddedToCart {
                  cartId, userId, productId, quantity,
                  priceSnapshot: 2999.90,
                  correlationId
                }

  Resposta ao frontend: 201 Created
  { cartId, items: [...], totalWithSnapshot: 5999.80 }
```

---

## Nível 4 — Código (Referências)

O nível de código aponta para as implementações concretas nos arquivos do repositório:

| Componente | Arquivo de referência |
|---|---|
| Eventos de domínio | `shared/events/src/cart-events.ts` |
| Schemas de Order Events | `shared/events/src/order-events.ts` |
| Schemas de Payment Events | `shared/events/src/payment-events.ts` |
| Utilitário de Correlation ID | `shared/common/src/correlation.ts` |
| Padrão Result (error handling) | `shared/common/src/result.ts` |
| Docker Compose (infra local) | `infrastructure/docker/docker-compose.yml` |
| K8s base manifests | `infrastructure/kubernetes/base/` |
| Prometheus scrape config | `infrastructure/docker/monitoring/prometheus/prometheus.yml` |

---

## Comunicação entre Microsserviços

### Mapa de eventos Kafka

```
                    ┌──────────────────────────────────────────────────────────────────┐
                    │                      APACHE KAFKA                                │
                    │                                                                  │
  User Service ────►│ user-events: UserRegistered, UserProfileUpdated, EmailVerified   │
                    │                                                                  │
  Product Service ─►│ product-events: ProductCreated, ProductUpdated,                 │
                    │                 InventoryAdjusted, InventoryReserved,            │
                    │                 InventoryReservationFailed                       │
                    │                                                                  │
  Order Service ───►│ order-events: OrderCreated, OrderPlaced, OrderConfirmed,        │
                    │               OrderCancelled, OrderShipped                       │
                    │                                                                  │
  Payment Service ─►│ payment-events: PaymentInitiated, PaymentCompleted,             │
                    │                 PaymentFailed, RefundProcessed                   │
                    │                                                                  │
  Cart Service ────►│ cart-events: CartCreated, ItemAddedToCart,                      │
                    │              ItemRemovedFromCart                                 │
                    └──────────────────────────────────────────────────────────────────┘
                                              │
           ┌──────────────────────────────────┼───────────────────────────────────┐
           │                                  │                                   │
           ▼                                  ▼                                   ▼
  ┌──────────────────┐               ┌──────────────────┐             ┌────────────────────┐
  │  Search Service  │               │  Product Service  │             │ Notification Svc   │
  │                  │               │                   │             │                    │
  │ Consome:         │               │ Consome:          │             │ Consome:           │
  │ - ProductCreated │               │ - OrderPlaced     │             │ - UserRegistered   │
  │ - ProductUpdated │               │ - OrderCancelled  │             │ - OrderConfirmed   │
  │ - InventoryAdj.  │               │                   │             │ - OrderCancelled   │
  └──────────────────┘               └──────────────────┘             │ - PaymentFailed    │
                                                                       │ - EmailVerif.Req.  │
                                                                       └────────────────────┘
```

### Fluxo de interação Frontend → Microsserviços

| Funcionalidade | Rota (API Gateway) | Microsserviço destino | Banco de dados |
|---|---|---|---|
| Cadastro de usuário | `POST /api/v1/users/register` | User Service | PostgreSQL |
| Login | `POST /api/v1/users/login` | User Service | PostgreSQL + Redis |
| Busca de produto | `GET /api/v1/search?q=rtx4080` | Search Service | Elasticsearch |
| Autocomplete | `GET /api/v1/search/autocomplete?q=note` | Search Service | Elasticsearch |
| Detalhe do produto | `GET /api/v1/products/:id` | Product Service | PostgreSQL + Redis |
| Listar produtos | `GET /api/v1/products?category=gpu` | Product Service | PostgreSQL |
| Criar carrinho | `POST /api/v1/carts` | Cart Service | Redis + PostgreSQL |
| Adicionar ao carrinho | `POST /api/v1/carts/:id/items` | Cart Service | Redis + PostgreSQL |
| Remover do carrinho | `DELETE /api/v1/carts/:id/items/:itemId` | Cart Service | Redis + PostgreSQL |
| Criar pedido | `POST /api/v1/orders` | Order Service | PostgreSQL |
| Cancelar pedido | `PUT /api/v1/orders/:id/cancel` | Order Service | PostgreSQL + Kafka |
| Iniciar pagamento | `POST /api/v1/payments/intents` | Payment Service | PostgreSQL + Stripe |
| Confirmar pagamento | `POST /api/v1/payments/:id/confirm` | Payment Service | PostgreSQL + Stripe |

---

## Análise pelo Teorema CAP

O Teorema CAP afirma que um sistema distribuído pode garantir no máximo duas das três propriedades: **Consistência (C)**, **Disponibilidade (A)** e **Tolerância a Partições (P)**. Como partições de rede são inevitáveis em sistemas distribuídos, a escolha real é entre CP (prioriza consistência) e AP (prioriza disponibilidade).

| Microsserviço | Classificação CAP | Justificativa |
|---|---|---|
| **User Service** | **CP** | Dados de identidade e credenciais exigem consistência forte. Um login não pode retornar dados desatualizados. Replica síncrona do PostgreSQL; Redis como cache invalidado na escrita. |
| **Product Service** | **CP** | Controle de estoque usa bloqueio otimista (versioning) no PostgreSQL para evitar overselling. Preferimos falhar a transação a vender produto sem estoque disponível. |
| **Search Service** | **AP** | A busca tolera dados levemente desatualizados (janela de segundos). Alta disponibilidade é mais crítica que consistência imediata; se o Elasticsearch estiver momentaneamente desatualizado, o usuário ainda consegue pesquisar. |
| **Cart Service** | **AP** | O carrinho prioriza disponibilidade: é preferível permitir que o usuário adicione um item (com snapshot de preço) mesmo que o dado de estoque no Redis esteja levemente desatualizado. A reserva real ocorre no checkout via Product Service. |
| **Order Service** | **CP** | Pedidos são registros financeiros. Consistência forte é obrigatória — preferimos rejeitar a criação de um pedido duplicado a ter dois pedidos para a mesma compra. Padrão Outbox garante atomicidade entre banco e Kafka. |
| **Payment Service** | **CP** | Pagamentos exigem consistência absoluta. Idempotência via Stripe Idempotency-Key e deduplicação local garantem que uma cobrança ocorra no máximo uma vez. |
| **Notification Service** | **AP** | Notificações são best-effort. Alta disponibilidade é prioritária — um e-mail atrasado é aceitável; um e-mail nunca enviado pode ser reprocessado via DLQ. |

**Nota sobre PACELC:** Em ausência de partições, o sistema favorece **baixa latência (EL)** para serviços AP e **consistência (EC)** para serviços CP, seguindo o modelo PACELC estendido.

---

## Conformidade com Twelve-Factor App

O [Twelve-Factor App](https://12factor.net) é uma metodologia para construção de software como serviço escalável, mantível e portável. Analisamos a conformidade da plataforma com cada fator:

| Fator | Status | Implementação na plataforma |
|---|---|---|
| **I. Codebase** (um repositório, múltiplos deploys) | ✅ Conforme | Monorepo com npm workspaces; branches por ambiente via CI/CD |
| **II. Dependencies** (dependências declaradas e isoladas) | ✅ Conforme | `package.json` por serviço; sem dependências implícitas do sistema |
| **III. Config** (configuração no ambiente) | ✅ Conforme | Todas as configurações via variáveis de ambiente (`.env.example`); nenhum segredo no código |
| **IV. Backing Services** (serviços de apoio como recursos anexados) | ✅ Conforme | PostgreSQL, Redis, Kafka, Elasticsearch são acessados via URL configurável por variável de ambiente |
| **V. Build, Release, Run** (estágios separados) | ✅ Conforme | CI/CD separa build (Docker image), release (tag + config) e run (Kubernetes pod) |
| **VI. Processes** (processos stateless) | ✅ Conforme | Cada microsserviço é stateless; estado persistido em PostgreSQL, Redis ou Kafka |
| **VII. Port Binding** (serviços exportados via porta) | ✅ Conforme | Cada serviço expõe sua porta via `PORT` env var; API Gateway é o único ponto de entrada |
| **VIII. Concurrency** (escalar via processos) | ✅ Conforme | Horizontal scaling via réplicas no Kubernetes; consumer groups Kafka escalam por partição |
| **IX. Disposability** (inicialização rápida, desligamento gracioso) | ✅ Conforme | Graceful shutdown implementado (SIGTERM → drena conexões → encerra); healthchecks `/health/live` e `/health/ready` |
| **X. Dev/Prod Parity** (ambientes similares) | ✅ Conforme | Docker Compose localmente espelha produção Kubernetes; mesmas imagens e variáveis |
| **XI. Logs** (logs como streams de eventos) | ✅ Conforme | Logs estruturados (JSON) com `correlationId`; exportados para stdout; Prometheus + Jaeger para observabilidade |
| **XII. Admin Processes** (tarefas administrativas como processos pontuais) | ✅ Conforme | Migrations via `npm run migrate:all` (script separado); seed data via `scripts/seed-data.ts` |

**Pontos de atenção:**
- **Fator III**: garantir que nenhum valor padrão de senha ou chave secreta esteja hardcoded em código-fonte (verificar `secrets.yaml.template` no Kubernetes)
- **Fator IX**: implementar timeout de desligamento configurável para consumers Kafka (draining de mensagens em processamento antes do SIGTERM completar)

---

## Referências

- [ADR-001 — Apache Kafka como Backbone de Comunicação Assíncrona](./ADR-001-kafka-event-driven.md)
- [ADR-002 — Elasticsearch como Motor de Busca e Descoberta de Produtos](./ADR-002-elasticsearch-search.md)
- [ADR-003 — Saga Pattern (Coreografia) para Transações Distribuídas](./ADR-003-saga-pattern.md)
- [Modelo C4](https://c4model.com) — Simon Brown
- [Twelve-Factor App](https://12factor.net)
- [Teorema CAP](https://en.wikipedia.org/wiki/CAP_theorem) — Eric Brewer
