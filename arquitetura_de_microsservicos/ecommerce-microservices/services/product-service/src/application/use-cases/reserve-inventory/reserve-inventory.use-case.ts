import { Result } from '@ecommerce/common';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IEventPublisher } from '../../ports/event-publisher.interface';
import { toInventoryAdjustedEvent } from '../../../domain/events/inventory-adjusted.event';
import { IProductCache } from '../get-product/get-product.use-case';

export interface ReserveInventoryDto {
  productId: string;
  quantity: number;
  orderId: string;
  correlationId: string;
}

export class ReserveInventoryUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly cache: IProductCache
  ) {}

  async execute(dto: ReserveInventoryDto): Promise<Result<void>> {
    let retries = 3;
    while (retries > 0) {
      try {
        const product = await this.productRepository.findById(dto.productId);
        if (!product) {
          return Result.fail(`Product ${dto.productId} not found`);
        }

        const reserveResult = product.reserveStock(dto.quantity);
        if (reserveResult.isFailure) {
          return Result.fail(reserveResult.error);
        }

        await this.productRepository.save(product);
        await this.cache.invalidate(dto.productId);

        const event = toInventoryAdjustedEvent(
          product.id,
          -dto.quantity,
          product.stock,
          'RESERVED',
          dto.correlationId
        );
        await this.eventPublisher.publish('product-events', event as unknown as Record<string, unknown>);

        return Result.ok();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const isOptimisticLock = /optimistic|version|concurrent/i.test(message);
        if (isOptimisticLock && retries > 1) {
          retries--;
          await this.sleep(100);
          continue;
        }
        throw err;
      }
    }
    return Result.fail('Failed to reserve inventory after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
