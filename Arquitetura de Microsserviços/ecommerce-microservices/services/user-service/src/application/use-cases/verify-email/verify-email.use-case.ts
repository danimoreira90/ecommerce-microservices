import { Result } from '@ecommerce/common';
import { randomUUID } from 'crypto';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { EmailVerifiedDomainEvent } from '../../../domain/events/email-verified.event';

export interface IEventPublisherEmailVerified {
  publish(topic: string, event: EmailVerifiedDomainEvent): Promise<void>;
}

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: IEventPublisherEmailVerified
  ) {}

  async execute(
    token: string,
    ctx: { correlationId: string; causationId: string }
  ): Promise<Result<User>> {
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      return Result.fail('Invalid or expired verification token');
    }
    if (user.emailVerified) {
      return Result.ok(user);
    }

    user.markEmailVerified();
    await this.userRepository.save(user);

    const event: EmailVerifiedDomainEvent = {
      eventId: randomUUID(),
      eventType: 'EmailVerified',
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: { userId: user.id, verifiedAt: new Date().toISOString() },
      metadata: ctx,
    };
    await this.eventPublisher.publish('user-events', event);

    return Result.ok(user);
  }
}
