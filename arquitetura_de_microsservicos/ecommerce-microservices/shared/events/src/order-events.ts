import { BaseDomainEvent } from './base-event';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderCreatedEvent extends BaseDomainEvent {
  eventType: 'OrderCreated';
  data: {
    orderId: string;
    userId: string;
    items: OrderItemPayload[];
    totalAmount: number;
    shippingAddress: Address;
    createdAt: string;
  };
}

export interface OrderPlacedEvent extends BaseDomainEvent {
  eventType: 'OrderPlaced';
  data: {
    orderId: string;
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceAtPurchase: number;
    }>;
    totalAmount: number;
    shippingAddress: Address;
    status: string;
    placedAt: string;
  };
}

export interface OrderConfirmedEvent extends BaseDomainEvent {
  eventType: 'OrderConfirmed';
  data: {
    orderId: string;
    userId: string;
    paymentId: string;
    status: string;
    confirmedAt: string;
  };
}

export interface OrderCancelledEvent extends BaseDomainEvent {
  eventType: 'OrderCancelled';
  data: {
    orderId: string;
    reason: string;
    cancelledAt: string;
  };
}

export interface OrderShippedEvent extends BaseDomainEvent {
  eventType: 'OrderShipped';
  data: {
    orderId: string;
    trackingNumber: string;
    shippedAt: string;
  };
}

export type OrderDomainEvent =
  | OrderCreatedEvent
  | OrderPlacedEvent
  | OrderConfirmedEvent
  | OrderCancelledEvent
  | OrderShippedEvent;
