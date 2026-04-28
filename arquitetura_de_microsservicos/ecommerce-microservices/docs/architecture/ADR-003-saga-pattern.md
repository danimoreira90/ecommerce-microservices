# ADR-003 — Saga Pattern (Coreografia) para Transações Distribuídas

| Campo      | Valor                          |
|------------|--------------------------------|
| **Status** | Aceito                         |
| **Data**   | 2026-03-07                     |
| **Autores**| Time de Arquitetura            |
| **Contexto**| Cenário 3 — E-commerce de Produtos Tech |

---

## Contexto

No e-commerce de produtos tech, o fluxo de finalização de compra envolve quatro microsserviços distintos, cada um com seu próprio banco de dados e ciclo de vida independente:

```
Cliente → Cart Service → Order Service → Payment Service → Product Service
```

O problema central é garantir que as seguintes operações ocorram de forma **consistente e atômica do ponto de vista do negócio**, mesmo que tecnicamente executadas em sistemas separados:

1. **Cart Service**: carrinho convertido em pedido (itens com snapshot de preço)
2. **Order Service**: pedido criado com status `PENDING`
3. **Product Service**: estoque reservado para os itens do pedido
4. **Payment Service**: pagamento processado via Stripe
5. **Order Service**: pedido confirmado (`CONFIRMED`) ou cancelado (`CANCELLED`) com estoque liberado

O cenário de **alto giro de estoque** do Cenário 3 agrava o problema: entre o momento em que o usuário adiciona um item ao carrinho e o momento em que confirma o pedido, o estoque pode ter sido esgotado por outro comprador. O sistema precisa:

- Detectar a falha de reserva de estoque e cancelar o pedido automaticamente
- Detectar a falha de pagamento e liberar o estoque reservado
- Garantir que nenhuma operação de compensação seja executada mais de uma vez (idempotência)

Uma transação distribuída tradicional com **2PC (Two-Phase Commit)** ou um lock global seria tecnicamente inviável dado o isolamento de bancos de dados por microsserviço.

---

## Decisão

Adotar o **Saga Pattern com Coreografia** (Choreography-based Saga) para coordenar a transação distribuída de pedido.

### Fluxo principal (caminho feliz)

```
1. Cliente faz checkout
       │
       ▼
2. Order Service cria pedido (status: PENDING)
   └─► Publica: OrderPlaced [topic: order-events]
       │
       ▼
3. Product Service consome OrderPlaced
   └─► Reserva estoque por item (idempotente por orderId)
   └─► Publica: InventoryReserved [topic: product-events]
       │
       ▼
4. Payment Service consome InventoryReserved
   └─► Inicia cobrança no Stripe
   └─► Publica: PaymentInitiated [topic: payment-events]
   └─► Aguarda webhook do Stripe → Publica: PaymentCompleted [topic: payment-events]
       │
       ▼
5. Order Service consome PaymentCompleted
   └─► Atualiza pedido para status: CONFIRMED
   └─► Publica: OrderConfirmed [topic: order-events]
       │
       ▼
6. Notification Service consome OrderConfirmed
   └─► Envia e-mail de confirmação ao cliente
```

### Fluxo de compensação — falha de estoque

```
3b. Product Service não consegue reservar estoque
    └─► Publica: InventoryReservationFailed [topic: product-events]
        │
        ▼
4b. Order Service consome InventoryReservationFailed
    └─► Atualiza pedido para status: CANCELLED (motivo: STOCK_UNAVAILABLE)
    └─► Publica: OrderCancelled [topic: order-events]
        │
        ▼
5b. Notification Service consome OrderCancelled
    └─► Envia e-mail de indisponibilidade ao cliente
```

### Fluxo de compensação — falha de pagamento

```
4c. Payment Service recebe resposta de recusa do Stripe
    └─► Publica: PaymentFailed [topic: payment-events]
        │
        ▼
5c. Order Service consome PaymentFailed
    └─► Atualiza pedido para status: CANCELLED (motivo: PAYMENT_DECLINED)
    └─► Publica: OrderCancelled [topic: order-events]
        │
        ▼
6c. Product Service consome OrderCancelled
    └─► Libera estoque reservado (operação de compensação)
        │
        ▼
7c. Notification Service consome OrderCancelled
    └─► Envia e-mail de falha de pagamento ao cliente
```

### Garantias de idempotência

| Serviço          | Chave de idempotência     | Implementação                              |
|------------------|---------------------------|---------------------------------------------|
| Order Service    | `orderId`                 | Verifica se pedido já existe antes de criar |
| Product Service  | `orderId` + `productId`   | Tabela de reservas com unique constraint    |
| Payment Service  | `Idempotency-Key` (Stripe)| Header enviado ao Stripe + registro local   |
| Notification     | `eventId` (BaseDomainEvent)| Registro de eventos já processados         |

---

## Alternativas Consideradas

### Alternativa 1 — Saga com Orquestração (Orchestration-based Saga)

**Descrição:** Um **Saga Orchestrator** centralizado (geralmente o Order Service assume esse papel, ou um serviço dedicado) conhece todo o fluxo e envia comandos diretamente para cada participante, aguardando respostas.

```
Orchestrator ──► Comando: ReserveInventory ──► Product Service
Orchestrator ◄── Resposta: InventoryReserved ◄── Product Service
Orchestrator ──► Comando: ProcessPayment ──► Payment Service
Orchestrator ◄── Resposta: PaymentCompleted ◄── Payment Service
```

**Prós:**
- Fluxo explícito e centralizado — fácil de visualizar o estado atual da saga
- Mais fácil de depurar: o orquestrador conhece em qual passo a saga parou
- Gerenciamento de erros e compensações em um único lugar
- Ferramentas como Temporal, Conductor ou AWS Step Functions oferecem implementação robusta

**Contras:**
- **Ponto único de falha lógico**: se o orquestrador ficar lento ou indisponível, todas as sagas em andamento ficam bloqueadas
- **Acoplamento de domínio**: o orquestrador precisa conhecer os contratos de todos os participantes, violando o isolamento de bounded contexts
- **Complexidade adicional**: requer armazenamento de estado da saga (banco de dados do orquestrador) e lógica de retry/timeout
- **Latência adicionada**: cada passo passa pelo orquestrador, adicionando uma hop de rede a mais
- Para o Cenário 3, o volume de pedidos simultâneos durante picos (Black Friday) poderia sobrecarregar um orquestrador único

**Decisão:** Rejeitada. O princípio de autonomia dos bounded contexts e a ausência de um ponto central de falha pesaram contra a orquestração. A coreografia é mais adequada para times que evoluem serviços independentemente.

---

### Alternativa 2 — Two-Phase Commit (2PC) / Transação Distribuída XA

**Descrição:** Usar o protocolo 2PC para garantir atomicidade distribuída: um coordenador pergunta a todos os participantes se podem confirmar (`PREPARE`), e só então emite o `COMMIT` global.

**Prós:**
- Consistência forte (ACID) garantida entre todos os participantes
- Familiar para equipes com background em bancos relacionais
- Sem necessidade de lógica de compensação manual

**Contras:**
- **Indisponibilidade de recursos durante o bloqueio**: durante a fase PREPARE, todos os recursos (linhas no banco) ficam bloqueados, impedindo outras transações — inaceitável em períodos de alto volume
- **Incompatibilidade com microsserviços**: bancos heterogêneos (PostgreSQL, Redis, Elasticsearch) raramente oferecem suporte ao protocolo XA de forma confiável
- **Falha do coordenador**: se o coordenador cair entre as fases PREPARE e COMMIT, todos os participantes ficam bloqueados indefinidamente
- **Escalabilidade zero**: 2PC é inerentemente pessimista e não escala para sistemas distribuídos de alta disponibilidade
- Violação do princípio CAP: favorece Consistência mas sacrifica Disponibilidade, inadequado para um e-commerce que precisa de alta disponibilidade

**Decisão:** Rejeitada categoricamente. 2PC é incompatível com a arquitetura de microsserviços com bancos isolados por domínio.

---

## Consequências

### Benefícios

- **Desacoplamento total**: nenhum serviço conhece diretamente os outros — eles apenas reagem a eventos publicados no Kafka, respeitando os limites dos bounded contexts
- **Alta disponibilidade**: não há ponto central de falha; se o Payment Service estiver indisponível momentaneamente, os eventos permanecem no tópico Kafka e são processados assim que o serviço se recuperar
- **Escalabilidade independente**: o Product Service pode ter mais réplicas para absorver picos de reserva de estoque sem afetar outros serviços
- **Rastreabilidade completa**: o `correlationId` presente em todos os eventos permite reconstruir o fluxo completo de uma saga via Jaeger, mesmo que os eventos tenham sido processados por diferentes instâncias de serviço
- **Compensação explícita no código de negócio**: as operações de rollback (liberar estoque, cancelar pedido) são regras de negócio explícitas, não efeitos colaterais ocultos de um mecanismo de transação
- **Resiliência a falhas parciais**: o sistema continua operando mesmo que um serviço esteja degradado; os eventos são processados assim que a situação normaliza

### Desafios

- **Rastreabilidade da saga**: diferente da orquestração, não há um único lugar para ver "em qual passo está o pedido X" — mitigado com `correlationId` e dashboards no Jaeger/Grafana que agregam eventos por `orderId`
- **Gestão de timeouts**: se um evento de resposta nunca chegar (ex.: Product Service nunca publica `InventoryReserved`), o pedido fica em status `PENDING` indefinidamente — é necessário um job de limpeza que cancela pedidos `PENDING` após um timeout configurável (ex.: 15 minutos)
- **Ordem de eventos**: em cenários de alta concorrência, eventos do mesmo `orderId` podem chegar fora de ordem — o Kafka garante ordenação por partição; usar `orderId` como partition key mitiga isso
- **Depuração de falhas silenciosas**: se um consumer não publicar o evento de resposta esperado (bug), o sistema fica "preso" silenciosamente — monitorar via alertas de lag de consumer group e pedidos em status `PENDING` há mais de X minutos
- **Múltiplas entrega de eventos (at-least-once)**: todos os consumers devem implementar idempotência robusta para evitar dupla reserva ou dupla cobrança

---

## Notas

- O **Padrão Outbox** implementado no Order Service garante que o evento `OrderPlaced` seja publicado no Kafka somente após o commit bem-sucedido da transação no PostgreSQL, eliminando o risco de publicar um evento para um pedido que falhou ao ser persistido
- Pedidos em status `PENDING` por mais de **15 minutos** devem ser automaticamente cancelados por um job agendado (cron), com publicação do evento `OrderCancelled` e liberação de estoque
- O Payment Service usa o **`Idempotency-Key` do Stripe** (gerado a partir do `orderId`) para garantir que mesmo em caso de retry da saga, apenas uma cobrança seja realizada
- O status do pedido serve como fonte de verdade para o estado da saga: `PENDING` → `CONFIRMED` ou `CANCELLED`
- Referências: [ADR-001](./ADR-001-kafka-event-driven.md) para a infraestrutura Kafka que suporta a coreografia; [ADR-002](./ADR-002-elasticsearch-search.md) para atualização do índice de busca após mudanças de estoque
