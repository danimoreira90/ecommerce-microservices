import { randomUUID } from 'crypto';

export interface ProductCreatedEventPayload {
  eventId: string;
  eventType: 'ProductCreated';
  timestamp: string;
  version: string;
  data: {
    productId: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category: string;
    createdAt: string;
  };
  metadata: {
    correlationId: string;
    causationId: string;
  };
}

export function toProductCreatedEvent(
  productId: string,
  name: string,
  sku: string,
  price: number,
  stock: number,
  category: string,
  correlationId: string
): ProductCreatedEventPayload {
  return {
    eventId: randomUUID(),
    eventType: 'ProductCreated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      productId,
      name,
      sku,
      price,
      stock,
      category,
      createdAt: new Date().toISOString(),
    },
    metadata: { correlationId, causationId: correlationId },
  };
}
