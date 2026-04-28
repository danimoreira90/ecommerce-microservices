# Order Service

Order lifecycle, saga orchestration, outbox. Events: OrderCreated, OrderPlaced, OrderConfirmed, OrderCancelled, OrderShipped. Consumes: PaymentCompleted, PaymentFailed, InventoryReservationFailed.

APIs: POST /api/v1/orders, GET /api/v1/orders/:id, GET /api/v1/orders, PUT /api/v1/orders/:id/cancel
