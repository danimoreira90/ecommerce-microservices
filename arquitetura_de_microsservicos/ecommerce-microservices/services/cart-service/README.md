# Cart Service

Shopping cart: add/remove items, TTL, price snapshot. Redis + PostgreSQL. Events: CartCreated, ItemAddedToCart, ItemRemovedFromCart.

APIs: POST /api/v1/carts, POST /api/v1/carts/:cartId/items, DELETE /api/v1/carts/:cartId/items/:itemId, GET /api/v1/carts/:cartId
