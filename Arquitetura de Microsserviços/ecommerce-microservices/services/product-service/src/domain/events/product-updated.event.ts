import { randomUUID } from 'crypto';

export interface ProductUpdatedEventPayload {
  eventId: string;
  eventType: 'ProductUpdated';
  timestamp: string;
  version: string;
  data: {
    productId: string;
    changes: Record<string, unknown>;
    updatedAt: string;
  };
  metadata: {
    correlationId: string;
    causationId: string;
  };
}

export function toProductUpdatedEvent(
  productId: string,
  changes: Record<string, unknown>,
  correlationId: string
): ProductUpdatedEventPayload {
  return {
    eventId: randomUUID(),
    eventType: 'ProductUpdated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      productId,
      changes,
      updatedAt: new Date().toISOString(),
    },
    metadata: { correlationId, causationId: correlationId },
  };
}
