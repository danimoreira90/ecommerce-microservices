import { randomUUID } from 'crypto';
import { User } from '../entities/user.entity';

export interface EmailVerifiedDomainEvent {
  eventId: string;
  eventType: 'EmailVerified';
  timestamp: string;
  version: '1.0';
  data: {
    userId: string;
    verifiedAt: string;
  };
  metadata: {
    correlationId: string;
    causationId: string;
  };
}

export function toEmailVerifiedEvent(
  user: User,
  metadata: { correlationId: string; causationId: string }
): EmailVerifiedDomainEvent {
  return {
    eventId: randomUUID(),
    eventType: 'EmailVerified',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      userId: user.id,
      verifiedAt: (user.emailVerifiedAt ?? new Date()).toISOString(),
    },
    metadata,
  };
}
