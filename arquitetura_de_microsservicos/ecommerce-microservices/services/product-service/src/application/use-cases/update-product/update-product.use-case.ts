import { Result } from '@ecommerce/common';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IEventPublisher } from '../../ports/event-publisher.interface';
import { toProductUpdatedEvent } from '../../../domain/events/product-updated.event';
import { IProductCache } from '../get-product/get-product.use-case';

export interface UpdateProductDto {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrls?: string[];
  correlationId: string;
}

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly cache: IProductCache
  ) {}

  async execute(dto: UpdateProductDto): Promise<Result<Product>> {
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail(`Product ${dto.id} not found`);
    }

    const changes: Record<string, unknown> = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.description !== undefined) changes.description = dto.description;
    if (dto.price !== undefined) changes.price = dto.price;
    if (dto.category !== undefined) changes.category = dto.category;
    if (dto.imageUrls !== undefined) changes.imageUrls = dto.imageUrls;

    product.update({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category: dto.category,
      imageUrls: dto.imageUrls,
    });

    await this.productRepository.save(product);
    await this.cache.invalidate(dto.id);

    const event = toProductUpdatedEvent(dto.id, changes, dto.correlationId);
    await this.eventPublisher.publish('product-events', event as unknown as Record<string, unknown>);

    return Result.ok(product);
  }
}
