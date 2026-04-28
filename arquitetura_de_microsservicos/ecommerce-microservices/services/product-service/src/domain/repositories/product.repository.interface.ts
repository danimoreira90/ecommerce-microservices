import { Product } from '../entities/product.entity';

export interface IProductRepository {
  save(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  delete(id: string): Promise<void>;
}
