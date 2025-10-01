import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.PRODUCT_DB_HOST || 'localhost',
  port: parseInt(process.env.PRODUCT_DB_PORT || '5432'),
  username: process.env.PRODUCT_DB_USERNAME || 'postgres',
  password: process.env.PRODUCT_DB_PASSWORD || '123456789',
  database: process.env.PRODUCT_DB_DATABASE || 'product_db',
  schema: process.env.PRODUCT_DB_SCHEMA || 'public',
  entities: [
    'apps/product-service/src/app/brands/infrastructure/entities/*.entity{.ts,.js}',
    'apps/product-service/src/app/categories/infrastructure/entities/*.entity{.ts,.js}',
    'apps/product-service/src/app/products/entities/*.entity{.ts,.js}'
  ],
  migrations: ['apps/product-service/src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['query', 'error', 'schema', 'warn', 'info', 'log'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // Log slow queries over 1 second
});
