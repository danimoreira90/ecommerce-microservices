/**
 * Seed script for product service. Run from product-service dir:
 * npx ts-node scripts/seed-products.ts
 * Requires DB_* and optional REDIS_* env vars.
 */
import { DataSource } from 'typeorm';
import { ProductTypeOrmEntity } from '../src/infrastructure/database/product.typeorm-entity';

async function seed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME ?? 'product_service',
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    entities: [ProductTypeOrmEntity],
    synchronize: false,
  });

  await dataSource.initialize();

  const repo = dataSource.getRepository(ProductTypeOrmEntity);

  const products = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Sample Widget',
      description: 'A sample product for testing',
      price: 29.99,
      stock: 100,
      sku: 'SAMPLE01',
      category: 'Electronics',
      imageUrls: '',
      active: true,
      version: 1,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Demo Gadget',
      description: 'Demo product',
      price: 49.99,
      stock: 50,
      sku: 'DEMO0001',
      category: 'Gadgets',
      imageUrls: '',
      active: true,
      version: 1,
    },
  ];

  for (const p of products) {
    const existing = await repo.findOne({ where: { id: p.id } });
    if (!existing) {
      await repo.save(repo.create(p));
    }
  }

  console.log(`Seeded ${products.length} products`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
