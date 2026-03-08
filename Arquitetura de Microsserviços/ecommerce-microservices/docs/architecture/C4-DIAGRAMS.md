# Diagramas C4 — E-Commerce de Produtos Tecnológicos

> Cenário 3: Alta rotatividade de produtos, integração em tempo real com fornecedores, precificação dinâmica e recomendações personalizadas.

---

## Nível 1 — Diagrama de Contexto (System Context)

```mermaid
C4Context
    title Sistema de E-Commerce de Produtos Tecnológicos — Contexto

    Person(customer, "Cliente", "Compra produtos tecnológicos, busca, compara preços e acompanha pedidos")
    Person(admin, "Administrador", "Gerencia catálogo, monitora pedidos e configura precificação dinâmica")
    Person(supplier, "Fornecedor", "Atualiza estoque e preços em tempo real via integração")

    System(ecommerce, "Plataforma E-Commerce Tech", "Permite busca, comparação, compra e acompanhamento de produtos tecnológicos com precificação dinâmica")

    System_Ext(stripe, "Stripe", "Processamento de pagamentos com cartão e PIX")
    System_Ext(sendgrid, "SendGrid", "Envio de e-mails transacionais e notificações")
    System_Ext(supplier_api, "APIs de Fornecedores", "Atualização de estoque e preços em tempo real")

    Rel(customer, ecommerce, "Busca, compara e compra produtos", "HTTPS")
    Rel(admin, ecommerce, "Gerencia catálogo e monitora operações", "HTTPS")
    Rel(supplier, supplier_api, "Publica atualizações de estoque/preço")
    Rel(ecommerce, stripe, "Processa pagamentos", "HTTPS/API REST")
    Rel(ecommerce, sendgrid, "Envia notificações por e-mail", "HTTPS/API REST")
    Rel(ecommerce, supplier_api, "Consome atualizações de estoque", "HTTPS/Webhooks")
```

---

## Nível 2 — Diagrama de Containers

```mermaid
C4Container
    title Sistema de E-Commerce de Produtos Tecnológicos — Containers

    Person(customer, "Cliente", "Usa web ou app mobile")
    Person(admin, "Administrador", "Gerencia via painel admin")

    System_Boundary(ecommerce, "Plataforma E-Commerce Tech") {

        Container(spa, "Frontend Web / Mobile", "Next.js / React Native", "Interface do cliente para busca, comparação e compra")
        Container(gateway, "API Gateway", "Node.js / Kong", "Roteamento, autenticação JWT, rate limiting e correlação de requests")

        Container(user_svc, "User Service", "NestJS + PostgreSQL", "Cadastro, autenticação, emissão de JWT e perfil do usuário")
        Container(product_svc, "Product Service", "NestJS + PostgreSQL + Redis", "Catálogo, estoque, cache e precificação dinâmica")
        Container(search_svc, "Search Service", "NestJS + Elasticsearch", "Busca full-text, facetas, autocomplete e comparação de produtos")
        Container(cart_svc, "Cart Service", "NestJS + Redis + PostgreSQL", "Carrinho com TTL, snapshot de preços e persistência")
        Container(order_svc, "Order Service", "NestJS + PostgreSQL", "Ciclo de vida do pedido, Saga de orquestração e padrão Outbox")
        Container(payment_svc, "Payment Service", "NestJS + PostgreSQL", "Processamento de pagamentos, idempotência e webhooks Stripe")
        Container(notification_svc, "Notification Service", "NestJS", "Envio de e-mails e notificações via eventos Kafka")

        ContainerDb(kafka, "Apache Kafka", "Kafka 3.x", "Broker de eventos assíncronos entre microsserviços")
        ContainerDb(redis, "Redis", "Redis 7", "Cache distribuído e sessões de carrinho")
        ContainerDb(elasticsearch, "Elasticsearch", "ES 8.x", "Índice de produtos para busca e comparação")
    }

    System_Ext(stripe, "Stripe", "Gateway de pagamento")
    System_Ext(sendgrid, "SendGrid", "Provedor de e-mail")
    System_Ext(supplier_api, "APIs de Fornecedores", "Estoque e preços em tempo real")

    Rel(customer, spa, "Acessa via browser ou app", "HTTPS")
    Rel(admin, spa, "Gerencia via painel", "HTTPS")
    Rel(spa, gateway, "Todas as chamadas passam pelo gateway", "HTTPS/REST")

    Rel(gateway, user_svc, "Roteia autenticação e cadastro", "REST")
    Rel(gateway, product_svc, "Roteia consultas de produtos", "REST")
    Rel(gateway, search_svc, "Roteia buscas e comparações", "REST")
    Rel(gateway, cart_svc, "Roteia operações do carrinho", "REST")
    Rel(gateway, order_svc, "Roteia criação e consulta de pedidos", "REST")
    Rel(gateway, payment_svc, "Roteia pagamentos", "REST")

    Rel(product_svc, kafka, "Publica ProductUpdated, StockChanged, PriceChanged", "Kafka")
    Rel(cart_svc, kafka, "Publica CartCheckedOut", "Kafka")
    Rel(order_svc, kafka, "Publica OrderCreated, OrderConfirmed, OrderCancelled", "Kafka")
    Rel(payment_svc, kafka, "Publica PaymentProcessed, PaymentFailed", "Kafka")
    Rel(notification_svc, kafka, "Consome eventos para enviar notificações", "Kafka")
    Rel(search_svc, kafka, "Consome ProductUpdated para reindexar", "Kafka")

    Rel(product_svc, redis, "Cache de produtos e precificação", "Redis Protocol")
    Rel(cart_svc, redis, "Sessões de carrinho com TTL", "Redis Protocol")
    Rel(search_svc, elasticsearch, "Indexa e consulta produtos", "REST")
    Rel(payment_svc, stripe, "Processa pagamentos", "HTTPS")
    Rel(notification_svc, sendgrid, "Envia e-mails", "HTTPS")
    Rel(product_svc, supplier_api, "Consome atualizações de estoque/preço", "HTTPS/Webhooks")
```

---

## Nível 3 — Diagrama de Componentes (Cart Service)

```mermaid
C4Component
    title Cart Service — Componentes

    Person(customer, "Cliente", "Adiciona e remove produtos do carrinho")

    Container_Boundary(cart_svc, "Cart Service") {
        Component(cart_ctrl, "CartController", "NestJS Controller", "Recebe requisições REST: adicionar, remover, listar e limpar carrinho")
        Component(cart_service, "CartService", "NestJS Service", "Orquestra regras de negócio: validação de estoque, TTL e snapshot de preços")
        Component(price_snapshot, "PriceSnapshotService", "NestJS Service", "Captura e armazena o preço do produto no momento da adição ao carrinho")
        Component(cart_repo, "CartRepository", "TypeORM Repository", "Persistência do carrinho no PostgreSQL para histórico e recuperação")
        Component(cart_cache, "CartCacheAdapter", "ioredis", "Sessão ativa do carrinho no Redis com TTL de 30 minutos")
        Component(kafka_pub, "KafkaEventPublisher", "KafkaJS", "Publica evento CartCheckedOut quando o cliente finaliza a compra")
    }

    ContainerDb(redis, "Redis", "Sessões de carrinho")
    ContainerDb(postgres, "PostgreSQL", "Persistência de carrinhos")
    Container(product_svc, "Product Service", "Valida estoque e preços")
    Container(kafka, "Apache Kafka", "Broker de eventos")
    Container(gateway, "API Gateway", "Roteia requisições")

    Rel(customer, gateway, "POST /cart, DELETE /cart/:id", "HTTPS")
    Rel(gateway, cart_ctrl, "Repassa requisição autenticada", "REST")
    Rel(cart_ctrl, cart_service, "Delega operações de negócio")
    Rel(cart_service, price_snapshot, "Solicita snapshot de preço ao adicionar item")
    Rel(cart_service, cart_cache, "Lê e escreve sessão ativa do carrinho")
    Rel(cart_service, cart_repo, "Persiste e recupera carrinhos")
    Rel(cart_service, kafka_pub, "Dispara evento ao fazer checkout")
    Rel(cart_service, product_svc, "Valida disponibilidade de estoque", "gRPC")
    Rel(cart_cache, redis, "TTL 30min", "Redis Protocol")
    Rel(cart_repo, postgres, "CRUD de carrinho", "SQL")
    Rel(kafka_pub, kafka, "CartCheckedOut event", "Kafka")
```

---

## Nível 3 — Diagrama de Componentes (Product Service)

```mermaid
C4Component
    title Product Service — Componentes

    Container_Boundary(product_svc, "Product Service") {
        Component(product_ctrl, "ProductController", "NestJS Controller", "Endpoints REST para CRUD de produtos, estoque e preços")
        Component(product_service, "ProductService", "NestJS Service", "Regras de negócio: controle de estoque com bloqueio otimista")
        Component(pricing_engine, "DynamicPricingEngine", "NestJS Service", "Calcula preço dinâmico baseado em demanda, estoque e concorrência")
        Component(supplier_consumer, "SupplierWebhookConsumer", "NestJS Controller", "Recebe atualizações de estoque e preço dos fornecedores em tempo real")
        Component(product_repo, "ProductRepository", "TypeORM", "Persistência de produtos e histórico de preços no PostgreSQL")
        Component(product_cache, "ProductCacheAdapter", "ioredis", "Cache de produtos e preços com TTL de 5 minutos")
        Component(kafka_pub, "KafkaEventPublisher", "KafkaJS", "Publica ProductUpdated, StockChanged, PriceChanged")
    }

    ContainerDb(postgres, "PostgreSQL", "Catálogo de produtos")
    ContainerDb(redis, "Redis", "Cache de produtos")
    Container(kafka, "Apache Kafka", "Broker de eventos")
    System_Ext(supplier_api, "APIs de Fornecedores", "Webhooks de estoque/preço")

    Rel(supplier_api, supplier_consumer, "Webhook de atualização", "HTTPS")
    Rel(supplier_consumer, product_service, "Atualiza estoque e preço")
    Rel(product_service, pricing_engine, "Solicita cálculo de preço dinâmico")
    Rel(product_service, product_cache, "Cache-aside pattern")
    Rel(product_service, product_repo, "Persiste alterações")
    Rel(product_service, kafka_pub, "Publica eventos de produto")
    Rel(product_cache, redis, "TTL 5min", "Redis Protocol")
    Rel(product_repo, postgres, "CRUD + histórico", "SQL")
    Rel(kafka_pub, kafka, "ProductUpdated, StockChanged", "Kafka")
```

---

## Fluxo de Sequência — Checkout Completo

```mermaid
sequenceDiagram
    actor Cliente
    participant GW as API Gateway
    participant Cart as Cart Service
    participant Order as Order Service
    participant Payment as Payment Service
    participant Product as Product Service
    participant Kafka
    participant Notification as Notification Service

    Cliente->>GW: POST /checkout
    GW->>Cart: Valida e finaliza carrinho
    Cart->>Product: gRPC: Reserva estoque
    Product-->>Cart: Estoque reservado
    Cart->>Kafka: Publica CartCheckedOut
    Kafka->>Order: Consome CartCheckedOut
    Order->>Kafka: Publica OrderCreated
    Kafka->>Payment: Consome OrderCreated
    Payment->>Payment: Processa via Stripe
    alt Pagamento aprovado
        Payment->>Kafka: Publica PaymentProcessed
        Kafka->>Order: Consome PaymentProcessed
        Order->>Kafka: Publica OrderConfirmed
        Kafka->>Product: Debita estoque definitivo
        Kafka->>Notification: Envia e-mail de confirmação
        Notification-->>Cliente: E-mail: Pedido confirmado
    else Pagamento recusado
        Payment->>Kafka: Publica PaymentFailed
        Kafka->>Order: Consome PaymentFailed
        Order->>Kafka: Publica OrderCancelled
        Kafka->>Product: Libera reserva de estoque
        Kafka->>Notification: Envia e-mail de falha
        Notification-->>Cliente: E-mail: Pagamento recusado
    end
```
