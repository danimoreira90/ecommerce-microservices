import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../../domain/entities/product.entity';
import { IProductRepository } from '../../../../domain/repositories/product.repository.interface';
import { ProductTypeOrmEntity } from '../product.typeorm-entity';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductTypeOrmEntity)
    private readonly repo: Repository<ProductTypeOrmEntity>
  ) {}

  async save(product: Product): Promise<void> {
    const entity = this.toTypeOrm(product);
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const entity = await this.repo.findOne({ where: { sku: sku.toUpperCase().trim() } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const qb = this.repo.createQueryBuilder('product');

    if (filters.category) {
      qb.andWhere('product.category = :category', { category: filters.category });
    }
    if (filters.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.active !== undefined) {
      qb.andWhere('product.active = :active', { active: filters.active });
    }

    const total = await qb.getCount();
    qb.orderBy('product.createdAt', 'DESC');
    qb.skip(filters.offset ?? 0).take(filters.limit ?? 20);

    const entities = await qb.getMany();
    const products = entities.map((e) => this.toDomain(e));
    return { products, total };
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(entity: ProductTypeOrmEntity): Product {
    const imageUrls = entity.imageUrls ? entity.imageUrls.split(',').filter(Boolean) : [];
    return Product.fromPersistence(
      entity.id,
      entity.name,
      entity.description,
      Number(entity.price),
      entity.stock,
      entity.sku,
      entity.category,
      imageUrls,
      entity.active,
      entity.version
    );
  }

  private toTypeOrm(product: Product): ProductTypeOrmEntity {
    const e = new ProductTypeOrmEntity();
    e.id = product.id;
    e.name = product.name;
    e.description = product.description;
    e.price = product.price;
    e.stock = product.stock;
    e.sku = product.sku;
    e.category = product.category;
    e.imageUrls = product.imageUrls.join(',');
    e.active = product.active;
    e.version = product.version;
    return e;
  }
}
