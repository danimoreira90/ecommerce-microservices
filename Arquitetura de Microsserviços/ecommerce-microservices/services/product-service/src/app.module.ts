import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProductTypeOrmEntity } from './infrastructure/database/product.typeorm-entity';
import { ProductRepository } from './infrastructure/database/repositories/product.repository';
import { ProductCacheService, REDIS_CLIENT } from './infrastructure/cache/product-cache.service';
import { redisProvider } from './infrastructure/cache/redis.provider';
import { KafkaProducerService } from './infrastructure/messaging/kafka.producer';
import { KafkaConsumerService } from './infrastructure/messaging/kafka.consumer';
import { RedisIdempotencyStore } from './infrastructure/messaging/redis-idempotency.store';
import { env } from './infrastructure/config/environment.config';
import { CreateProductUseCase } from './application/use-cases/create-product/create-product.use-case';
import { GetProductUseCase } from './application/use-cases/get-product/get-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products/list-products.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product/delete-product.use-case';
import { ReserveInventoryUseCase } from './application/use-cases/reserve-inventory/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from './application/use-cases/release-inventory/release-inventory.use-case';
import { AdjustInventoryUseCase } from './application/use-cases/adjust-inventory/adjust-inventory.use-case';
import { ProductController } from './presentation/controllers/product.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: env.db.host(),
      port: env.db.port(),
      database: env.db.name(),
      username: env.db.user(),
      password: env.db.password(),
      entities: [ProductTypeOrmEntity],
      migrations: [__dirname + '/infrastructure/database/migrations/*.{ts,js}'],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([ProductTypeOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.jwt.secret(),
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [ProductController, HealthController],
  providers: [
    redisProvider,
    ProductRepository,
    ProductCacheService,
    KafkaProducerService,
    RedisIdempotencyStore,
    KafkaConsumerService,
    JwtStrategy,
    {
      provide: CreateProductUseCase,
      useFactory: (repo: ProductRepository, publisher: KafkaProducerService) =>
        new CreateProductUseCase(repo, publisher),
      inject: [ProductRepository, KafkaProducerService],
    },
    {
      provide: GetProductUseCase,
      useFactory: (repo: ProductRepository, cache: ProductCacheService) =>
        new GetProductUseCase(repo, cache),
      inject: [ProductRepository, ProductCacheService],
    },
    {
      provide: ListProductsUseCase,
      useFactory: (repo: ProductRepository) => new ListProductsUseCase(repo),
      inject: [ProductRepository],
    },
    {
      provide: UpdateProductUseCase,
      useFactory: (
        repo: ProductRepository,
        publisher: KafkaProducerService,
        cache: ProductCacheService,
      ) => new UpdateProductUseCase(repo, publisher, cache),
      inject: [ProductRepository, KafkaProducerService, ProductCacheService],
    },
    {
      provide: DeleteProductUseCase,
      useFactory: (repo: ProductRepository, cache: ProductCacheService) =>
        new DeleteProductUseCase(repo, cache),
      inject: [ProductRepository, ProductCacheService],
    },
    {
      provide: ReserveInventoryUseCase,
      useFactory: (
        repo: ProductRepository,
        publisher: KafkaProducerService,
        cache: ProductCacheService,
      ) => new ReserveInventoryUseCase(repo, publisher, cache),
      inject: [ProductRepository, KafkaProducerService, ProductCacheService],
    },
    {
      provide: ReleaseInventoryUseCase,
      useFactory: (
        repo: ProductRepository,
        publisher: KafkaProducerService,
        cache: ProductCacheService,
      ) => new ReleaseInventoryUseCase(repo, publisher, cache),
      inject: [ProductRepository, KafkaProducerService, ProductCacheService],
    },
    {
      provide: AdjustInventoryUseCase,
      useFactory: (
        repo: ProductRepository,
        publisher: KafkaProducerService,
        cache: ProductCacheService,
      ) => new AdjustInventoryUseCase(repo, publisher, cache),
      inject: [ProductRepository, KafkaProducerService, ProductCacheService],
    },
  ],
})
export class AppModule {}
