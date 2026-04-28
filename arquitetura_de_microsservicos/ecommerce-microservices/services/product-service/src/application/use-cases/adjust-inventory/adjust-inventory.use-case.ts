import { Result } from '@ecommerce/common';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IEventPublisher } from '../../ports/event-publisher.interface';
import { toInventoryAdjustedEvent } from '../../../domain/events/inventory-adjusted.event';
import { IProductCache } from '../get-product/get-product.use-case';

export interface AdjustInventoryDto {
  productId: string;
  delta: number;
  correlationId: string;
}

export class AdjustInventoryUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly cache: IProductCache
  ) {}

  async execute(dto: AdjustInventoryDto): Promise<Result<void>> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      return Result.fail(`Product ${dto.productId} not found`);
    }

    product.updateInventory(dto.delta);
    await this.productRepository.save(product);
    await this.cache.invalidate(dto.productId);

    const event = toInventoryAdjustedEvent(
      product.id,
      dto.delta,
      product.stock,
      'ADJUSTMENT',
      dto.correlationId
    );
    await this.eventPublisher.publish('product-events', event as unknown as Record<string, unknown>);

    return Result.ok();
  }
}
