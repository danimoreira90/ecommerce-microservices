/**
 * Notification service consumes events; these types represent
 * payloads it receives from other services (re-exported for typing).
 */
import type { UserRegisteredEvent } from './user-events';
import type { EmailVerificationRequestedEvent } from './user-events';
import type { OrderConfirmedEvent, OrderShippedEvent } from './order-events';
import type { PaymentCompletedEvent } from './payment-events';

export type {
  UserRegisteredEvent,
  EmailVerificationRequestedEvent,
  OrderConfirmedEvent,
  OrderShippedEvent,
  PaymentCompletedEvent,
};
