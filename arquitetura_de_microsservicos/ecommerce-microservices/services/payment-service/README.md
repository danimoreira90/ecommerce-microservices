# Payment Service

Stripe integration, webhooks (idempotent), refunds. PCI-DSS: no raw card data. Events: PaymentInitiated, PaymentCompleted, PaymentFailed, RefundProcessed. Consumes: OrderCreated.

APIs: POST /api/v1/payments/intents, POST /api/v1/payments/:id/confirm, POST /api/v1/payments/webhooks/stripe
