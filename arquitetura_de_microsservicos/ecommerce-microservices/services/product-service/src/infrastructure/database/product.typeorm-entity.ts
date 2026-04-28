import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn,
} from 'typeorm';

@Entity('products')
export class ProductTypeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column({ length: 50, unique: true })
  @Index('IDX_PRODUCT_SKU')
  sku: string;

  @Column({ length: 100 })
  @Index('IDX_PRODUCT_CATEGORY')
  category: string;

  @Column('text', { default: '' })
  imageUrls: string;

  @Column('boolean', { default: true })
  active: boolean;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
