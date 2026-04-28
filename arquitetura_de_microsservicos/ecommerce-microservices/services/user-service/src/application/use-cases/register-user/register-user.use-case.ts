import { Result } from '@ecommerce/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { toUserRegisteredEvent, UserRegisteredDomainEvent } from '../../../domain/events/user-registered.event';

export interface IEventPublisher {
  publish(topic: string, event: UserRegisteredDomainEvent): Promise<void>;
}

export interface RegisterUserUseCaseContext {
  correlationId: string;
  causationId: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(
    dto: { email: string; password: string; firstName: string; lastName: string },
    ctx: RegisterUserUseCaseContext
  ): Promise<Result<User>> {
    const emailVo = Email.create(dto.email);
    const validation = Password.validate(dto.password);
    if (!validation.valid) {
      return Result.fail(validation.message!);
    }

    const existing = await this.userRepository.findByEmail(emailVo.toString());
    if (existing) {
      return Result.fail('Email already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = User.create({
      id: uuidv4(),
      email: emailVo,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      emailVerified: false,
      role: 'user',
    });

    await this.userRepository.save(user);

    const event = toUserRegisteredEvent(user, {
      correlationId: ctx.correlationId,
      causationId: ctx.causationId,
    });
    await this.eventPublisher.publish('user-events', event);

    return Result.ok(user);
  }
}
