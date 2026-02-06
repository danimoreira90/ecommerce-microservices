import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { IProductCache } from '../../application/use-cases/get-product/get-product.use-case';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  del(key: string): Promise<number>;
}

@Injectable()
export class ProductCacheService implements IProductCache {
  private readonly TTL = 300; // 5 minutes
  private readonly keyPrefix = 'product:';

  constructor(private readonly redis: IRedisClient) {}

  async get(id: string): Promise<Product | null> {
    const cached = await this.redis.get(this.keyPrefix + id);
    if (!cached) return null;

    try {
      const data = JSON.parse(cached);
      return Product.fromPersistence(
        data.id,
        data.name,
        data.description,
        data.price,
        data.stock,
        data.sku,
        data.category,
        data.imageUrls ?? [],
        data.active ?? true,
        data.version ?? 1
      );
    } catch {
      return null;
    }
  }

  async set(product: Product): Promise<void> {
    const data = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      category: product.category,
      imageUrls: product.imageUrls,
      active: product.active,
      version: product.version,
    };
    await this.redis.setex(
      this.keyPrefix + product.id,
      this.TTL,
      JSON.stringify(data)
    );
  }

  async invalidate(id: string): Promise<void> {
    await this.redis.del(this.keyPrefix + id);
  }
}
