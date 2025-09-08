import { Injectable, Inject } from '@nestjs/common';
import { DatabaseConfig, ServiceDatabaseConfig, DatabaseConnectionOptions } from './database.interface';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DATABASE_CONFIG') private readonly defaultConfig: DatabaseConfig
  ) {}

  /**
   * Get database configuration for specific service
   * Each service can have its own database configuration
   */
  getServiceDatabaseConfig(serviceName: string): ServiceDatabaseConfig {
    // In real implementation, this would read from environment variables
    // or configuration files for each service
    const serviceConfigs: Record<string, ServiceDatabaseConfig> = {
      'product-service': {
        host: process.env['PRODUCT_DB_HOST'] || 'localhost',
        port: parseInt(process.env['PRODUCT_DB_PORT'] || '5432'),
        database: process.env['PRODUCT_DB_NAME'] || 'product_db',
        username: process.env['PRODUCT_DB_USER'] || 'postgres',
        password: process.env['PRODUCT_DB_PASSWORD'] || '123456789',
        //schema: 'product',
      },
      'cart-service': {
        host: process.env['CART_DB_HOST'] || 'localhost',
        port: parseInt(process.env['CART_DB_PORT'] || '5432'),
        database: process.env['CART_DB_NAME'] || 'cart_db',
        username: process.env['CART_DB_USER'] || 'postgres',
        password: process.env['CART_DB_PASSWORD'] || 'password',
        schema: 'cart',
      },
      'inventories-service': {
        host: process.env['INVENTORY_DB_HOST'] || 'localhost',
        port: parseInt(process.env['INVENTORY_DB_PORT'] || '5432'),
        database: process.env['INVENTORY_DB_NAME'] || 'inventory_db',
        username: process.env['INVENTORY_DB_USER'] || 'postgres',
        password: process.env['INVENTORY_DB_PASSWORD'] || 'password',
        schema: 'inventory',
      },
      'order-service': {
        host: process.env['ORDER_DB_HOST'] || 'localhost',
        port: parseInt(process.env['ORDER_DB_PORT'] || '5432'),
        database: process.env['ORDER_DB_NAME'] || 'order_db',
        username: process.env['ORDER_DB_USER'] || 'postgres',
        password: process.env['ORDER_DB_PASSWORD'] || 'password',
        schema: 'order',
      },
      'notification-service': {
        host: process.env['NOTIFICATION_DB_HOST'] || 'localhost',
        port: parseInt(process.env['NOTIFICATION_DB_PORT'] || '5432'),
        database: process.env['NOTIFICATION_DB_NAME'] || 'notification_db',
        username: process.env['NOTIFICATION_DB_USER'] || 'postgres',
        password: process.env['NOTIFICATION_DB_PASSWORD'] || 'password',
        schema: 'notification',
      },
    };

    return serviceConfigs[serviceName] || {
      host: 'localhost',
      port: 5432,
      database: 'default_db',
      username: 'postgres',
      password: 'password',
    };
  }

  /**
   * Get connection string for specific service
   */
  getConnectionString(serviceName: string): string {
    const config = this.getServiceDatabaseConfig(serviceName);
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Get pool configuration for specific service
   */
  getPoolConfig(serviceName: string): DatabaseConfig {
    // Service can override default pool configuration
    const servicePoolConfig = process.env[`${serviceName.toUpperCase()}_DB_POOL_CONFIG`];
    if (servicePoolConfig) {
      return { ...this.defaultConfig, ...JSON.parse(servicePoolConfig) };
    }
    return this.defaultConfig;
  }
}
