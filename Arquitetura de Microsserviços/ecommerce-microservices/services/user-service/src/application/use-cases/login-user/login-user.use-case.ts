import { Result } from '@ecommerce/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface ITokenService {
  generateAccessToken(user: User): string;
  generateRefreshToken(user: User): string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService
  ) {}

  async execute(email: string, password: string): Promise<Result<LoginResult>> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return Result.fail('Invalid email or password');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return Result.fail('Invalid email or password');
    }

    user.recordLogin();
    await this.userRepository.save(user);

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return Result.ok({
      user,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 min in seconds
    });
  }
}
