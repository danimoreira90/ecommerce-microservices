import { Email } from '../value-objects/email.vo';

export type UserRole = 'user' | 'admin';

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerifiedAt?: Date;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get emailVerificationToken(): string | undefined {
    return this.props.emailVerificationToken;
  }

  get emailVerifiedAt(): Date | undefined {
    return this.props.emailVerifiedAt;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  markEmailVerified(): void {
    (this.props as UserProps).emailVerified = true;
    (this.props as UserProps).emailVerifiedAt = new Date();
    (this.props as UserProps).emailVerificationToken = undefined;
    (this.props as UserProps).updatedAt = new Date();
  }

  updateProfile(fields: { firstName?: string; lastName?: string }): void {
    if (fields.firstName !== undefined) (this.props as UserProps).firstName = fields.firstName;
    if (fields.lastName !== undefined) (this.props as UserProps).lastName = fields.lastName;
    (this.props as UserProps).updatedAt = new Date();
  }

  recordLogin(): void {
    (this.props as UserProps).lastLoginAt = new Date();
    (this.props as UserProps).updatedAt = new Date();
  }
}
