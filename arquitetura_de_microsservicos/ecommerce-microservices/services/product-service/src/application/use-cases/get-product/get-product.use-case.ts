import { Result } from '@ecommerce/common';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';

export interface IProductCache {
  get(id: string): Promise<Product | null>;
  set(product: Product): Promise<void>;
  invalidate(id: string): Promise<void>;
}

export interface GetProductDto {
  id: string;
  correlationId?: string;
}

export class GetProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly cache: IProductCache
  ) {}

  async execute(dto: GetProductDto): Promise<Result<Product>> {
    const cached = await this.cache.get(dto.id);
    if (cached) {
      return Result.ok(cached);
    }

    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail(`Product ${dto.id} not found`);
    }

    await this.cache.set(product);
    return Result.ok(product);
  }
}
