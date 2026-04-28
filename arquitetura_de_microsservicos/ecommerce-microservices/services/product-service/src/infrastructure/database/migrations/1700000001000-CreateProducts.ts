import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProducts1700000001000 implements MigrationInterface {
  name = 'CreateProducts1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'stock', type: 'int', default: 0 },
          { name: 'sku', type: 'varchar', length: '50' },
          { name: 'category', type: 'varchar', length: '100' },
          { name: 'imageUrls', type: 'text', default: "''" },
          { name: 'active', type: 'boolean', default: true },
          { name: 'version', type: 'int', default: 1 },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'IDX_PRODUCT_SKU', columnNames: ['sku'] })
    );
    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'IDX_PRODUCT_CATEGORY', columnNames: ['category'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
