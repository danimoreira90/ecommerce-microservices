import { Product } from '../../src/domain/entities/product.entity';

describe('Product', () => {
  describe('create', () => {
    it('should create product with valid data', () => {
      const result = Product.create({
        name: 'Widget',
        description: 'A widget',
        price: 19.99,
        stock: 50,
        sku: 'WIDGET01',
        category: 'Tools',
      });
      expect(result.isSuccess).toBe(true);
      const product = result.value;
      expect(product.name).toBe('Widget');
      expect(product.sku).toBe('WIDGET01');
      expect(product.price).toBe(19.99);
      expect(product.stock).toBe(50);
      expect(product.version).toBe(1);
    });

    it('should fail when name is empty', () => {
      const result = Product.create({
        name: '  ',
        description: 'x',
        price: 1,
        stock: 0,
        sku: 'SKU1234',
        category: 'Cat',
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('name');
    });

    it('should fail when price is not positive', () => {
      const result = Product.create({
        name: 'X',
        description: 'x',
        price: 0,
        stock: 0,
        sku: 'SKU1234',
        category: 'Cat',
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Price');
    });

    it('should fail when stock is negative', () => {
      const result = Product.create({
        name: 'X',
        description: 'x',
        price: 1,
        stock: -1,
        sku: 'SKU1234',
        category: 'Cat',
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stock');
    });

    it('should fail for invalid SKU (too short)', () => {
      const result = Product.create({
        name: 'X',
        description: 'x',
        price: 1,
        stock: 0,
        sku: '123',
        category: 'Cat',
      });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('SKU');
    });
  });

  describe('reserveStock', () => {
    it('should decrease stock by quantity', () => {
      const product = Product.fromPersistence(
        'id',
        'P',
        'D',
        10,
        100,
        'SKU123',
        'Cat',
        [],
        true,
        1,
      );
      const result = product.reserveStock(30);
      expect(result.isSuccess).toBe(true);
      expect(product.stock).toBe(70);
    });

    it('should fail when insufficient stock', () => {
      const product = Product.fromPersistence(
        'id',
        'P',
        'D',
        10,
        10,
        'SKU123',
        'Cat',
        [],
        true,
        1,
      );
      const result = product.reserveStock(20);
      expect(result.isFailure).toBe(true);
      expect(product.stock).toBe(10);
    });
  });

  describe('releaseStock', () => {
    it('should increase stock by quantity', () => {
      const product = Product.fromPersistence(
        'id',
        'P',
        'D',
        10,
        50,
        'SKU123',
        'Cat',
        [],
        true,
        1,
      );
      const result = product.releaseStock(10);
      expect(result.isSuccess).toBe(true);
      expect(product.stock).toBe(60);
    });
  });
});
