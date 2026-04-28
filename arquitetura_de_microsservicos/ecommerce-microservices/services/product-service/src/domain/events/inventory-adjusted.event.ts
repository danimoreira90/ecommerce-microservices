import { randomUUID } from 'crypto';

export type InventoryAdjustmentReason = 'RESERVED' | 'RELEASED' | 'ADJUSTMENT';

export interface InventoryAdjustedEventPayload {
  eventId: string;
  eventType: 'InventoryAdjusted';
  timestamp: string;
  version: string;
  data: {
    productId: string;
    delta: number;
    newStock: number;
    reason: InventoryAdjustmentReason;
    adjustedAt: string;
  };
  metadata: {
    correlationId: string;
    causationId: string;
  };
}

export function toInventoryAdjustedEvent(
  productId: string,
  delta: number,
  newStock: number,
  reason: InventoryAdjustmentReason,
  correlationId: string
): InventoryAdjustedEventPayload {
  return {
    eventId: randomUUID(),
    eventType: 'InventoryAdjusted',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      productId,
      delta,
      newStock,
      reason,
      adjustedAt: new Date().toISOString(),
    },
    metadata: { correlationId, causationId: correlationId },
  };
}
