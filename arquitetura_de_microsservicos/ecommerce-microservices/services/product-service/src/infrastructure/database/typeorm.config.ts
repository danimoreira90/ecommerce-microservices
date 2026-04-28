import { DataSource } from 'typeorm';
import { ProductTypeOrmEntity } from './product.typeorm-entity';
import { env } from '../config/environment.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host(),
  port: env.db.port(),
  database: env.db.name(),
  username: env.db.user(),
  password: env.db.password(),
  entities: [ProductTypeOrmEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
