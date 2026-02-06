import { BaseDomainEvent } from './base-event';

export interface ProductCreatedEvent extends BaseDomainEvent {
  eventType: 'ProductCreated';
  data: {
    productId: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    sku: string;
    createdAt: string;
  };
}

export interface ProductUpdatedEvent extends BaseDomainEvent {
  eventType: 'ProductUpdated';
  data: {
    productId: string;
    changes: Record<string, unknown>;
    updatedAt: string;
  };
}

export interface InventoryAdjustedEvent extends BaseDomainEvent {
  eventType: 'InventoryAdjusted';
  data: {
    productId: string;
    delta: number;
    newStock: number;
    reason?: string;
    adjustedAt: string;
  };
}

export interface InventoryReservedEvent extends BaseDomainEvent {
  eventType: 'InventoryReserved';
  data: {
    orderId: string;
    items: Array<{ productId: string; quantity: number }>;
    reservedAt: string;
  };
}

export interface InventoryReservationFailedEvent extends BaseDomainEvent {
  eventType: 'InventoryReservationFailed';
  data: {
    orderId: string;
    productId?: string;
    reason: string;
    failedAt: string;
  };
}

export type ProductDomainEvent =
  | ProductCreatedEvent
  | ProductUpdatedEvent
  | InventoryAdjustedEvent
  | InventoryReservedEvent
  | InventoryReservationFailedEvent;
