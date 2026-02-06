import { Result } from '@ecommerce/common';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IEventPublisher } from '../../ports/event-publisher.interface';
import { toProductCreatedEvent } from '../../../domain/events/product-created.event';

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  imageUrls?: string[];
  correlationId: string;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(dto: CreateProductDto): Promise<Result<Product>> {
    const existing = await this.productRepository.findBySku(dto.sku.trim().toUpperCase());
    if (existing) {
      return Result.fail('Product with this SKU already exists');
    }

    const productResult = Product.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      sku: dto.sku,
      category: dto.category,
      imageUrls: dto.imageUrls,
    });

    if (productResult.isFailure) {
      return Result.fail(productResult.error);
    }

    const product = productResult.value;
    await this.productRepository.save(product);

    const event = toProductCreatedEvent(
      product.id,
      product.name,
      product.sku,
      product.price,
      product.stock,
      product.category,
      dto.correlationId
    );
    await this.eventPublisher.publish('product-events', event as unknown as Record<string, unknown>);

    return Result.ok(product);
  }
}
