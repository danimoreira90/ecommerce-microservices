import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../domain/entities/user.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from '../user.orm-entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>
  ) {}

  async save(user: User): Promise<User> {
    const orm = this.toOrm(user);
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.toLowerCase().trim() } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { emailVerificationToken: token } });
    return orm ? this.toDomain(orm) : null;
  }

  private toDomain(orm: UserOrmEntity): User {
    return User.create({
      id: orm.id,
      email: Email.create(orm.email),
      passwordHash: orm.passwordHash,
      firstName: orm.firstName,
      lastName: orm.lastName,
      emailVerified: orm.emailVerified,
      emailVerificationToken: orm.emailVerificationToken ?? undefined,
      emailVerifiedAt: orm.emailVerifiedAt ?? undefined,
      role: orm.role as 'user' | 'admin',
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      lastLoginAt: orm.lastLoginAt ?? undefined,
    });
  }

  private toOrm(user: User): UserOrmEntity {
    const e = new UserOrmEntity();
    e.id = user.id;
    e.email = user.email.toString();
    e.passwordHash = user.passwordHash;
    e.firstName = user.firstName;
    e.lastName = user.lastName;
    e.emailVerified = user.emailVerified;
    e.emailVerificationToken = user.emailVerificationToken ?? null;
    e.emailVerifiedAt = user.emailVerifiedAt ?? null;
    e.role = user.role;
    e.createdAt = user.createdAt;
    e.updatedAt = user.updatedAt;
    e.lastLoginAt = user.lastLoginAt ?? null;
    return e;
  }
}
