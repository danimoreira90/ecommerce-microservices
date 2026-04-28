import { BaseDomainEvent } from './base-event';

export interface CartCreatedEvent extends BaseDomainEvent {
  eventType: 'CartCreated';
  data: {
    cartId: string;
    userId?: string;
    createdAt: string;
  };
}

export interface ItemAddedToCartEvent extends BaseDomainEvent {
  eventType: 'ItemAddedToCart';
  data: {
    cartId: string;
    productId: string;
    quantity: number;
    priceSnapshot: number;
    addedAt: string;
  };
}

export interface ItemRemovedFromCartEvent extends BaseDomainEvent {
  eventType: 'ItemRemovedFromCart';
  data: {
    cartId: string;
    productId: string;
    removedAt: string;
  };
}

export type CartDomainEvent =
  | CartCreatedEvent
  | ItemAddedToCartEvent
  | ItemRemovedFromCartEvent;
