import { Result } from '@ecommerce/common';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IProductCache } from '../get-product/get-product.use-case';

export interface DeleteProductDto {
  id: string;
  correlationId?: string;
}

export class DeleteProductUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly cache: IProductCache
  ) {}

  async execute(dto: DeleteProductDto): Promise<Result<void>> {
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail(`Product ${dto.id} not found`);
    }
    await this.cache.invalidate(dto.id);
    await this.productRepository.delete(dto.id);
    return Result.ok();
  }
}
