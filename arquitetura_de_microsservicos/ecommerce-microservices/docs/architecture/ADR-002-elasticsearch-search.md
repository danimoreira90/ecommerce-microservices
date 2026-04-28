# ADR-002 — Elasticsearch como Motor de Busca e Descoberta de Produtos

| Campo      | Valor                          |
|------------|--------------------------------|
| **Status** | Aceito                         |
| **Data**   | 2026-03-07                     |
| **Autores**| Time de Arquitetura            |
| **Contexto**| Cenário 3 — E-commerce de Produtos Tech |

---

## Contexto

O catálogo de produtos tecnológicos possui características que tornam a busca um dos componentes mais críticos e complexos da plataforma:

- **Diversidade de atributos técnicos**: produtos como notebooks, GPUs e smartphones possuem dezenas de especificações (processador, memória RAM, armazenamento, resolução de tela, sistema operacional, conectividade) que variam radicalmente entre categorias. Um cliente não busca apenas por nome — busca por combinações de atributos.
- **Comparação entre produtos**: o Cenário 3 exige que o usuário possa comparar lado a lado especificações técnicas de produtos concorrentes, o que requer recuperação eficiente de múltiplos documentos com campos heterogêneos.
- **Alto giro e precificação dinâmica**: preços e disponibilidade mudam frequentemente; a busca precisa refletir essas mudanças rapidamente.
- **Experiência de descoberta**: autocomplete, correção ortográfica e busca por sinônimos (ex.: "notebook" vs "laptop") são essenciais para a conversão.
- **Escala**: um catálogo de produtos tech pode ter dezenas de milhares de SKUs ativos, com filtros facetados (faixas de preço, marca, avaliação, disponibilidade, especificações técnicas) que devem retornar em milissegundos.

O **Search Service** (`search-service`, porta 3003) é um microsserviço dedicado e independente do Product Service, consumindo eventos Kafka (`ProductCreated`, `ProductUpdated`, `InventoryAdjusted`) para manter seu índice sincronizado de forma assíncrona.

---

## Decisão

Adotar **Elasticsearch 8.x** como o banco de dados primário do Search Service, com sincronização via eventos Kafka publicados pelo Product Service.

### Estratégia de índice

O índice principal `products` é estruturado com mapeamento explícito para suportar:

```
products (índice Elasticsearch)
├── id, sku, name, description (full-text, analisado)
├── category, brand (keyword, para facets e filtros exatos)
├── price (float, para range queries e ordenação)
├── stock (integer, para filtro de disponibilidade)
├── rating (float, para ordenação por avaliação)
├── attributes (objeto dinâmico — specs técnicas por categoria)
│   ├── cpu, ram, storage (notebooks)
│   ├── vram, tdp, architecture (GPUs)
│   └── screen_size, battery, os (smartphones)
└── updatedAt (date, para ordenação por novidade)
```

### Capacidades habilitadas

| Funcionalidade              | Implementação Elasticsearch                         |
|-----------------------------|-----------------------------------------------------|
| Busca full-text             | `multi_match` em `name`, `description`, `brand`    |
| Filtros facetados           | `terms` aggregation em `category`, `brand`          |
| Range de preço              | `range` query em `price`                            |
| Autocomplete                | `search_as_you_type` field type no campo `name`     |
| Correção ortográfica        | `fuzziness: AUTO` nas queries                       |
| Sinônimos                   | Filtro de sinônimos no analisador personalizado     |
| Ordenação por relevância    | BM25 scoring padrão do Elasticsearch                |
| Comparação de produtos      | `ids` query para recuperar múltiplos documentos     |
| Disponibilidade em tempo real| Atualização via evento `InventoryAdjusted` (Kafka) |

---

## Alternativas Consideradas

### Alternativa 1 — PostgreSQL Full-Text Search

**Descrição:** Usar as capacidades nativas de busca textual do PostgreSQL (`tsvector`, `tsquery`, `GIN indexes`) diretamente no Product Service, sem um serviço de busca separado.

**Prós:**
- Zero infraestrutura adicional — reutiliza o banco já existente
- Transações ACID garantem consistência imediata entre cadastro e busca
- Menor complexidade operacional
- `pg_trgm` permite busca fuzzy e similaridade

**Contras:**
- **Performance degradada em escala**: índices GIN são eficientes para texto, mas agregações facetadas complexas (múltiplos filtros simultâneos + ordenação + paginação) impõem carga significativa no banco relacional, competindo com operações de escrita
- **Sem recursos avançados de relevância**: o ranking BM25 do Elasticsearch é superior ao `ts_rank` do PostgreSQL para buscas em linguagem natural
- **Sem autocomplete nativo eficiente**: `search_as_you_type` do Elasticsearch é otimizado; emular com `LIKE 'prefix%'` ou `pg_trgm` tem desempenho inferior em grandes volumes
- **Atributos heterogêneos**: a estrutura de colunas fixas do PostgreSQL dificulta indexar especificações técnicas variáveis por categoria (solução EAV ou JSONB tem trade-offs de performance)
- **Violação do princípio de separação de responsabilidades**: o banco do Product Service acumularia carga de leitura intensiva da busca

**Decisão:** Rejeitada. A complexidade dos filtros facetados e a necessidade de autocomplete de alta performance tornam o PostgreSQL inadequado como solução primária de busca.

---

### Alternativa 2 — Algolia

**Descrição:** Usar o serviço de busca gerenciado Algolia (SaaS), que oferece busca full-text, facets, autocomplete e analytics out-of-the-box via API.

**Prós:**
- **Zero operação de infraestrutura**: totalmente gerenciado, sem preocupação com shards, replicas ou upgrades
- **Latência extremamente baixa** (< 10ms em média) com infraestrutura global de CDN
- **Dashboard de analytics** e A/B testing de relevância nativos
- **SDK bem documentado** para múltiplas linguagens
- Implementação rápida (dias vs. semanas)

**Contras:**
- **Custo variável e elevado em escala**: precificação por operações (buscas + indexações); em catálogos com alto giro (muitos `ProductUpdated` / `InventoryAdjusted` por dia), o custo de indexação pode escalar significativamente
- **Vendor lock-in**: migrar de Algolia implica reescrever toda a camada de busca e reindexar o catálogo
- **Controle limitado sobre o índice e o analisador**: personalizar stemming, sinônimos técnicos (ex.: "DDR5" vs "DDR 5") e atributos dinâmicos por categoria é mais restrito que no Elasticsearch
- **Dados fora da infraestrutura controlada**: para catálogos que contêm informações sensíveis (preços de custo, margens), enviar dados para um SaaS externo levanta questões de governança
- **Latência de indexação**: atualizações de estoque enviadas via API Algolia têm latência variável dependendo do plano

**Decisão:** Rejeitada. O custo em escala, o vendor lock-in e a menor flexibilidade para atributos técnicos heterogêneos pesaram contra Algolia. O Elasticsearch auto-hospedado oferece controle total sem custo por operação.

---

## Consequências

### Benefícios

- **Performance de busca**: queries complexas com múltiplos filtros, facets e ordenação retornam em < 50ms mesmo com dezenas de milhares de produtos indexados
- **Autocomplete sem latência perceptível**: o tipo `search_as_you_type` do Elasticsearch entrega sugestões em < 20ms, melhorando a experiência de descoberta de produtos tech
- **Flexibilidade de schema**: atributos técnicos dinâmicos por categoria (notebooks vs GPUs vs smartphones) são indexados em campos dinâmicos sem necessidade de alterar o schema do banco relacional
- **Busca por sinônimos técnicos**: o analisador personalizado trata "notebook" = "laptop", "SSD" = "solid state drive", melhorando a taxa de conversão
- **Isolamento de carga**: toda a carga de leitura de busca é absorvida pelo Search Service, sem impacto no Product Service (PostgreSQL)
- **Escalabilidade horizontal**: shards e replicas do Elasticsearch escalam horizontalmente conforme o catálogo cresce
- **Comparação de produtos**: recuperação eficiente de múltiplos documentos por ID para a funcionalidade de comparação side-by-side

### Desafios

- **Consistência eventual**: há uma janela de milissegundos a segundos entre a publicação de `ProductUpdated` no Kafka e a atualização do índice Elasticsearch — aceitável para busca, mas o Cart Service usa snapshot de preço para garantir o preço no checkout
- **Complexidade operacional**: requer monitoramento de health do cluster, gestão de shards, snapshots para backup — mitigado com a configuração no Docker Compose (local) e Kubernetes (produção)
- **Sincronização inicial**: ao subir o Search Service pela primeira vez (ou após falha), é necessário reindexar todo o catálogo do Product Service — implementar endpoint de reindexação sob demanda
- **Drift de dados**: se o consumer Kafka do Search Service ficar para trás (lag alto), o índice pode ficar desatualizado — monitorar lag do consumer group `search-service-group` via Prometheus
- **Mapeamento explícito**: campos mal mapeados no índice podem causar erros de indexação — manter o mapeamento versionado no repositório e aplicar via migration script

---

## Notas

- O Search Service consome os tópicos `product-events` via Kafka (consumer group `search-service-group`) para manter o índice atualizado de forma reativa
- A sincronização de `InventoryAdjusted` é especialmente crítica: quando um produto fica sem estoque, o índice deve ser atualizado rapidamente para evitar que o cliente clique em um produto indisponível
- O campo `stock` no índice é usado para filtrar produtos disponíveis por padrão, mas não como fonte de verdade para reserva — essa responsabilidade permanece no Product Service (PostgreSQL com bloqueio otimista)
- Referências: [ADR-001](./ADR-001-kafka-event-driven.md) para o mecanismo de sincronização via Kafka; [ADR-003](./ADR-003-saga-pattern.md) para o fluxo de reserva de estoque no checkout
