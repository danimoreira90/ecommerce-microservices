import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user/login-user.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email/verify-email.use-case';
import { getOrCreateCorrelationId, CORRELATION_ID_HEADER } from '@ecommerce/common';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';

@Controller('api/v1/users')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserRequestDto, @Req() req: { headers: Record<string, string> }) {
    const correlationId = getOrCreateCorrelationId(req.headers[CORRELATION_ID_HEADER]);
    const result = await this.registerUserUseCase.execute(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      { correlationId, causationId: correlationId }
    );

    if (result.isFailure) {
      const err = new Error(result.error) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const user = result.value;
    return {
      userId: user.id,
      email: user.email.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.loginUserUseCase.execute(body.email, body.password);
    if (result.isFailure) {
      const err = new Error(result.error) as Error & { statusCode?: number };
      err.statusCode = 401;
      throw err;
    }
    const { user, accessToken, refreshToken, expiresIn } = result.value;
    return {
      userId: user.id,
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() body: { token: string },
    @Req() req: { headers: Record<string, string> }
  ) {
    const correlationId = getOrCreateCorrelationId(req.headers[CORRELATION_ID_HEADER]);
    const result = await this.verifyEmailUseCase.execute(body.token, {
      correlationId,
      causationId: correlationId,
    });
    if (result.isFailure) {
      const err = new Error(result.error) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    return { verified: true, userId: result.value.id };
  }
}
