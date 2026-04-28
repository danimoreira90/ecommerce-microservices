import { BaseDomainEvent } from './base-event';

export interface UserRegisteredEvent extends BaseDomainEvent {
  eventType: 'UserRegistered';
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    registeredAt: string;
  };
}

export interface UserProfileUpdatedEvent extends BaseDomainEvent {
  eventType: 'UserProfileUpdated';
  data: {
    userId: string;
    fields: Record<string, unknown>;
    updatedAt: string;
  };
}

export interface EmailVerifiedEvent extends BaseDomainEvent {
  eventType: 'EmailVerified';
  data: {
    userId: string;
    verifiedAt: string;
  };
}

export interface EmailVerificationRequestedEvent extends BaseDomainEvent {
  eventType: 'EmailVerificationRequested';
  data: {
    userId: string;
    email: string;
    token: string;
    requestedAt: string;
  };
}

export type UserDomainEvent =
  | UserRegisteredEvent
  | UserProfileUpdatedEvent
  | EmailVerifiedEvent
  | EmailVerificationRequestedEvent;
