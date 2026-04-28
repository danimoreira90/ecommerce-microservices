import { Result } from '@ecommerce/common';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';

export interface ListProductsDto {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
  limit?: number;
  offset?: number;
  correlationId?: string;
}

export interface ListProductsResult {
  products: Product[];
  total: number;
}

export class ListProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(dto: ListProductsDto): Promise<Result<ListProductsResult>> {
    const { products, total } = await this.productRepository.findAll({
      category: dto.category,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
      active: dto.active,
      limit: dto.limit ?? 20,
      offset: dto.offset ?? 0,
    });
    return Result.ok({ products, total });
  }
}
