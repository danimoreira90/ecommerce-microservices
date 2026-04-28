import { Result } from '@ecommerce/common';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IEventPublisher } from '../../ports/event-publisher.interface';
import { toInventoryAdjustedEvent } from '../../../domain/events/inventory-adjusted.event';
import { IProductCache } from '../get-product/get-product.use-case';

export interface ReleaseInventoryDto {
  productId: string;
  quantity: number;
  orderId: string;
  correlationId: string;
}

export class ReleaseInventoryUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly cache: IProductCache
  ) {}

  async execute(dto: ReleaseInventoryDto): Promise<Result<void>> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      return Result.fail(`Product ${dto.productId} not found`);
    }

    const releaseResult = product.releaseStock(dto.quantity);
    if (releaseResult.isFailure) {
      return Result.fail(releaseResult.error);
    }

    await this.productRepository.save(product);
    await this.cache.invalidate(dto.productId);

    const event = toInventoryAdjustedEvent(
      product.id,
      dto.quantity,
      product.stock,
      'RELEASED',
      dto.correlationId
    );
    await this.eventPublisher.publish('product-events', event as unknown as Record<string, unknown>);

    return Result.ok();
  }
}
