import { RegisterUserUseCase } from '../../src/application/use-cases/register-user/register-user.use-case';
import { IUserRepository } from '../../src/domain/repositories/user.repository.interface';
import { User } from '../../src/domain/entities/user.entity';
import { Email } from '../../src/domain/value-objects/email.vo';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventPublisher: { publish: jest.Mock };

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailVerificationToken: jest.fn(),
    };
    mockEventPublisher = { publish: jest.fn().mockResolvedValue(undefined) };
    useCase = new RegisterUserUseCase(mockUserRepository, mockEventPublisher);
  });

  it('should register user with valid data', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation(async (u) => u);

    const result = await useCase.execute(
      {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      },
      { correlationId: 'cid', causationId: 'cid' }
    );

    expect(result.isSuccess).toBe(true);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      'user-events',
      expect.objectContaining({
        eventType: 'UserRegistered',
        data: expect.objectContaining({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }),
      })
    );
  });

  it('should fail if email already exists', async () => {
    const existingUser = User.create({
      id: 'id',
      email: Email.create('existing@example.com'),
      passwordHash: 'hash',
      firstName: 'J',
      lastName: 'D',
      emailVerified: false,
      role: 'user',
    });
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    const result = await useCase.execute(
      {
        email: 'existing@example.com',
        password: 'Pass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      { correlationId: 'c', causationId: 'c' }
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Email already registered');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('should fail for weak password', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(
      {
        email: 'test@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
      },
      { correlationId: 'c', causationId: 'c' }
    );

    expect(result.isFailure).toBe(true);
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
