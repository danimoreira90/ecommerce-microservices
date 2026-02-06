import { JwtService } from '@nestjs/jwt';
import { User } from '../../domain/entities/user.entity';
import { LoginUserUseCase, ITokenService } from '../use-cases/login-user/login-user.use-case';

export class AuthTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtExpiration: string,
    private readonly refreshExpiration: string
  ) {}

  generateAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email.toString(),
        roles: [user.role],
      },
      { expiresIn: this.jwtExpiration }
    );
  }

  generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: this.refreshExpiration }
    );
  }
}
