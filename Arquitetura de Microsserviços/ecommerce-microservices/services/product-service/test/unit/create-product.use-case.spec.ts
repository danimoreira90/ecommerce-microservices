import { CreateProductUseCase } from '../../src/application/use-cases/create-product/create-product.use-case';
import { IProductRepository } from '../../src/domain/repositories/product.repository.interface';
import { IEventPublisher } from '../../src/application/ports/event-publisher.interface';
import { Product } from '../../src/domain/entities/product.entity';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepository: jest.Mocked<IProductRepository>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findBySku: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CreateProductUseCase(mockRepository, mockEventPublisher);
  });

  it('should create product with valid data', async () => {
    mockRepository.findBySku.mockResolvedValue(null);

    const dto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock: 100,
      sku: 'TEST123',
      category: 'Electronics',
      correlationId: 'test-correlation-id',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      'product-events',
      expect.objectContaining({
        eventType: 'ProductCreated',
        data: expect.objectContaining({
          name: 'Test Product',
          sku: 'TEST123',
          price: 99.99,
          stock: 100,
        }),
      }),
    );
  });

  it('should fail if SKU already exists', async () => {
    const existingProduct = Product.fromPersistence(
      'id',
      'Existing',
      'Desc',
      10,
      5,
      'EXISTING',
      'Cat',
      [],
      true,
      1,
    );
    mockRepository.findBySku.mockResolvedValue(existingProduct);

    const dto = {
      name: 'Test Product',
      description: 'Test',
      price: 99.99,
      stock: 100,
      sku: 'EXISTING',
      category: 'Electronics',
      correlationId: 'test-id',
    };

    const result = await useCase.execute(dto);

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('already exists');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
