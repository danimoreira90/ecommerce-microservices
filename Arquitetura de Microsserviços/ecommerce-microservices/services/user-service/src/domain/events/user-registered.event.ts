import { randomUUID } from 'crypto';
import { User } from '../entities/user.entity';

export interface UserRegisteredDomainEvent {
  eventId: string;
  eventType: 'UserRegistered';
  timestamp: string;
  version: '1.0';
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    registeredAt: string;
  };
  metadata: {
    correlationId: string;
    causationId: string;
  };
}

export function toUserRegisteredEvent(
  user: User,
  metadata: { correlationId: string; causationId: string }
): UserRegisteredDomainEvent {
  return {
    eventId: randomUUID(),
    eventType: 'UserRegistered',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      userId: user.id,
      email: user.email.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      registeredAt: user.createdAt.toISOString(),
    },
    metadata,
  };
}
