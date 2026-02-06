import { BaseDomainEvent } from './base-event';

export interface PaymentInitiatedEvent extends BaseDomainEvent {
  eventType: 'PaymentInitiated';
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    stripePaymentIntentId: string;
    initiatedAt: string;
  };
}

export interface PaymentCompletedEvent extends BaseDomainEvent {
  eventType: 'PaymentCompleted';
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    transactionId: string;
    completedAt: string;
  };
}

export interface PaymentFailedEvent extends BaseDomainEvent {
  eventType: 'PaymentFailed';
  data: {
    paymentId: string;
    orderId: string;
    reason: string;
    failedAt: string;
  };
}

export interface RefundProcessedEvent extends BaseDomainEvent {
  eventType: 'RefundProcessed';
  data: {
    paymentId: string;
    refundId: string;
    amount: number;
    processedAt: string;
  };
}

export type PaymentDomainEvent =
  | PaymentInitiatedEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | RefundProcessedEvent;
