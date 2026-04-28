import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserOrmEntity } from './infrastructure/database/user.orm-entity';
import { UserRepository } from './infrastructure/database/repositories/user.repository';
import { KafkaProducerService } from './infrastructure/messaging/kafka.producer';
import { env } from './infrastructure/config/environment.config';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user/login-user.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email/verify-email.use-case';
import { AuthTokenService } from './application/services/auth.service';
import { UserController } from './presentation/controllers/user.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { MetricsController } from './presentation/controllers/metrics.controller';
import { JwtStrategy } from './shared/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: env.db.host(),
      port: env.db.port(),
      database: env.db.name(),
      username: env.db.user(),
      password: env.db.password(),
      entities: [UserOrmEntity],
      migrations: [__dirname + '/infrastructure/database/migrations/*.{ts,js}'],
      synchronize: process.env['DB_SYNCHRONIZE'] === 'true',
    }),
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.jwt.secret(),
      signOptions: { expiresIn: env.jwt.expiration() },
    }),
  ],
  controllers: [UserController, AuthController, HealthController, MetricsController],
  providers: [
    UserRepository,
    KafkaProducerService,
    {
      provide: AuthTokenService,
      useFactory: (jwtService: JwtService) =>
        new AuthTokenService(jwtService, env.jwt.expiration(), env.jwt.refreshExpiration()),
      inject: [JwtService],
    },
    JwtStrategy,
    {
      provide: RegisterUserUseCase,
      useFactory: (repo: UserRepository, kafka: KafkaProducerService) =>
        new RegisterUserUseCase(repo, kafka),
      inject: [UserRepository, KafkaProducerService],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (repo: UserRepository, auth: AuthTokenService) =>
        new LoginUserUseCase(repo, auth),
      inject: [UserRepository, AuthTokenService],
    },
    {
      provide: VerifyEmailUseCase,
      useFactory: (repo: UserRepository, kafka: KafkaProducerService) =>
        new VerifyEmailUseCase(repo, kafka),
      inject: [UserRepository, KafkaProducerService],
    },
  ],
})
export class AppModule {}
