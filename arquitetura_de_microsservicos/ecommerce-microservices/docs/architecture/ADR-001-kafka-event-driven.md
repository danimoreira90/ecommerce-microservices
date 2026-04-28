# ADR-001 — Apache Kafka como Backbone de Comunicação Assíncrona

| Campo      | Valor                          |
|------------|--------------------------------|
| **Status** | Aceito                         |
| **Data**   | 2026-03-07                     |
| **Autores**| Time de Arquitetura            |
| **Contexto**| Cenário 3 — E-commerce de Produtos Tech |

---

## Contexto

O e-commerce de produtos tecnológicos opera em um ambiente de **alto giro de estoque**, onde centenas de SKUs podem ter sua disponibilidade alterada em minutos. Fornecedores enviam atualizações de preço e quantidade continuamente, e qualquer defasagem entre o estoque real e o exibido ao cliente resulta em:

- Vendas de itens sem estoque (**overselling**), causando cancelamentos e perda de confiança
- Preços desatualizados frente à concorrência, impactando a conversão
- Inconsistências entre o carrinho, o catálogo e o sistema de pedidos

Além disso, o sistema é composto por **7 microsserviços independentes** (User, Product, Search, Cart, Order, Payment, Notification), cada um com seu próprio banco de dados. Isso torna inviável o uso de transações distribuídas síncronas sem comprometer a disponibilidade individual de cada serviço.

Outros requisitos que influenciaram a decisão:

- **Integração com fornecedores** em tempo real (atualizações de `ProductUpdated` e `InventoryAdjusted`)
- **Recomendações personalizadas** que dependem de stream de eventos comportamentais (itens adicionados ao carrinho, pedidos realizados)
- **Precificação dinâmica** que precisa propagar mudanças de preço rapidamente para o Search Service e o Cart Service (snapshot de preço)
- **Rastreabilidade** de todas as transações para auditoria e debugging

---

## Decisão

Adotar **Apache Kafka** como o backbone de mensageria assíncrona para toda a comunicação entre microsserviços que não exige resposta síncrona imediata.

Cada domínio possui seu próprio tópico Kafka:

| Tópico Kafka          | Publicado por        | Consumido por                          |
|-----------------------|----------------------|----------------------------------------|
| `user-events`         | User Service         | Notification Service                   |
| `product-events`      | Product Service      | Search Service, Cart Service           |
| `order-events`        | Order Service        | Product Service, Payment Service, Notification Service |
| `payment-events`      | Payment Service      | Order Service, Notification Service    |
| `cart-events`         | Cart Service         | (auditoria futura)                     |
| `notification-events` | Notification Service | (auditoria futura)                     |

A comunicação segue o padrão de **choreography-based saga**: cada serviço reage a eventos publicados por outros, sem um orquestrador central.

Eventos publicados carregam o `correlationId` para rastreabilidade de ponta a ponta via OpenTelemetry/Jaeger.

---

## Alternativas Consideradas

### Alternativa 1 — Comunicação REST Síncrona entre Serviços

**Descrição:** Cada microsserviço chama diretamente os endpoints HTTP dos outros serviços quando precisa notificar uma mudança (ex.: Order Service faz `PUT /products/:id/inventory` ao criar um pedido).

**Prós:**
- Simplicidade de implementação e depuração
- Resposta imediata com confirmação de sucesso/falha
- Sem infraestrutura adicional de mensageria

**Contras:**
- **Acoplamento temporal e estrutural**: se o Product Service estiver indisponível, o Order Service falha junto
- **Cascata de falhas**: uma lentidão num serviço downstream se propaga para upstream
- **Difícil escalar independentemente**: um pico no Order Service sobrecarrega diretamente o Product Service
- **Sem replay**: atualizações de estoque de fornecedores perdidas durante uma janela de indisponibilidade não podem ser recuperadas
- Inviável para integração assíncrona com fornecedores externos

**Decisão:** Rejeitada. O alto giro de produtos torna inadmissível o acoplamento temporal entre serviços.

---

### Alternativa 2 — RabbitMQ (AMQP)

**Descrição:** Usar RabbitMQ como message broker, com filas por tipo de evento e roteamento via exchanges.

**Prós:**
- Mais simples de operar que Kafka para cargas menores
- Modelo push nativo (Kafka requer pull por consumers)
- Confirmação de entrega (ack/nack) embutida no protocolo
- Interface de gerenciamento amigável

**Contras:**
- **Sem retenção durável de mensagens por padrão**: mensagens confirmadas são removidas; impossível reprocessar eventos históricos
- **Escalabilidade limitada de throughput**: menos adequado para streams de alta volumetria (ex.: atualizações massivas de fornecedor)
- **Sem compactação de log**: não é possível manter o "estado mais recente" de um produto por chave (log compaction do Kafka)
- Ecossistema de stream processing menos maduro que Kafka Streams/ksqlDB
- Particionamento manual e menos garantias de ordenação por chave

**Decisão:** Rejeitada. A necessidade de reprocessamento histórico de eventos de estoque e a integração futura com Kafka Streams para recomendações em tempo real pesaram contra RabbitMQ.

---

## Consequências

### Benefícios

- **Desacoplamento total**: cada microsserviço pode evoluir, ser implantado e escalar independentemente
- **Durabilidade e replay**: eventos de estoque e pedidos ficam retidos no log do Kafka (configurável por tempo ou tamanho); falhas transitórias são recuperadas sem perda de dados
- **Alta throughput**: Kafka suporta centenas de milhares de mensagens/segundo, adequado para picos de Black Friday e integrações de fornecedores em lote
- **Ordenação garantida por partição**: atualizações de um mesmo `productId` chegam em ordem ao consumidor, prevenindo race conditions no estoque
- **Rastreabilidade de ponta a ponta**: `correlationId` em todos os eventos viabiliza tracing distribuído (OpenTelemetry + Jaeger)
- **Base para recomendações**: o stream de `ItemAddedToCart` e `OrderPlaced` alimenta futuramente um pipeline de ML para recomendações personalizadas
- **Integração com fornecedores**: fornecedores externos podem publicar em tópicos Kafka via conectores (Kafka Connect) sem acoplamento direto aos microsserviços

### Desafios

- **Complexidade operacional**: requer Zookeeper (ou KRaft), brokers, monitoramento de lag de consumer groups — mitigado com Docker Compose (local) e Kubernetes (produção)
- **Consistência eventual**: mudanças de estoque levam milissegundos a se propagar para o Search Service — aceitável para o modelo de negócio; o Cart Service usa snapshot de preço para garantir o valor no momento da compra
- **Depuração mais difícil**: rastrear o fluxo de um pedido requer correlacionar logs de múltiplos tópicos — mitigado com `correlationId` obrigatório em todos os eventos
- **Idempotência obrigatória nos consumers**: o Kafka garante entrega "at least once"; cada consumer (ex.: Product Service ao receber `OrderPlaced`) deve ser idempotente por `orderId` para evitar dupla reserva de estoque
- **Curva de aprendizado**: a equipe deve dominar conceitos de consumer groups, offsets, partições e rebalanceamento

---

## Notas

- A configuração de retenção padrão dos tópicos é de **7 dias** para eventos de domínio; tópicos de auditoria (futuros) podem ter retenção maior
- O **Padrão Outbox** (implementado no Order Service) garante que eventos Kafka sejam publicados somente após o commit da transação no banco — eliminando o problema de "evento publicado mas transação revertida"
- Em caso de falha de consumo, o consumer group utiliza **Dead Letter Queue (DLQ)** para isolar mensagens problemáticas sem bloquear o processamento
- A decisão de usar **choreography** em vez de **orchestration saga** é documentada separadamente no [ADR-003](./ADR-003-saga-pattern.md)
- Referência: [ADR-002](./ADR-002-elasticsearch-search.md) descreve como o Search Service consome `product-events` para manter o índice Elasticsearch atualizado
