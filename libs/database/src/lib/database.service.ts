import { Inject, Injectable } from '@nestjs/common';
import { DatabaseConfig, ServiceDatabaseConfig } from './database.interface';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DATABASE_CONFIG') private readonly defaultConfig: DatabaseConfig,
  ) {}

  private toNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private resolveConfig(prefix: string, defaults: ServiceDatabaseConfig): ServiceDatabaseConfig {
    const normalisedPrefix = prefix.toUpperCase().replace(/-/g, '_');

    return {
      host: process.env[`${normalisedPrefix}_HOST`] ?? defaults.host,
      port: this.toNumber(process.env[`${normalisedPrefix}_PORT`], defaults.port),
      database: process.env[`${normalisedPrefix}_NAME`] ?? defaults.database,
      username: process.env[`${normalisedPrefix}_USER`] ?? defaults.username,
      password: process.env[`${normalisedPrefix}_PASSWORD`] ?? defaults.password,
      schema: process.env[`${normalisedPrefix}_SCHEMA`] ?? defaults.schema,
    };
  }

  getServiceDatabaseConfig(serviceName: string): ServiceDatabaseConfig {
    const defaults: Record<string, ServiceDatabaseConfig> = {
      'auth-service': {
        host: 'localhost',
        port: 5433,
        database: 'auth_db',
        username: 'auth_user',
        password: 'auth_pass',
      },
      'user-service': {
        host: 'localhost',
        port: 5434,
        database: 'user_db',
        username: 'user_user',
        password: 'user_pass',
      },
      'product-service': {
        host: 'localhost',
        port: 5435,
        database: 'product_db',
        username: 'product_user',
        password: 'product_pass',
      },
      'order-service': {
        host: 'localhost',
        port: 5436,
        database: 'order_db',
        username: 'order_user',
        password: 'order_pass',
      },
      'payment-service': {
        host: 'localhost',
        port: 5437,
        database: 'payment_db',
        username: 'payment_user',
        password: 'payment_pass',
      },
      'inventory-service': {
        host: 'localhost',
        port: 5438,
        database: 'inventory_db',
        username: 'inventory_user',
        password: 'inventory_pass',
      },
      'notification-service': {
        host: 'localhost',
        port: 5439,
        database: 'notification_db',
        username: 'notification_user',
        password: 'notification_pass',
      },
      'cart-service': {
        host: 'localhost',
        port: 5440,
        database: 'cart_db',
        username: 'cart_user',
        password: 'cart_pass',
      },
    };

    const serviceDefaults =
      defaults[serviceName] ?? {
        host: 'localhost',
        port: 5433,
        database: 'default_db',
        username: 'postgres',
        password: 'password',
      };

    return this.resolveConfig(serviceName, serviceDefaults);
  }

  getConnectionString(serviceName: string): string {
    const config = this.getServiceDatabaseConfig(serviceName);
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  getPoolConfig(serviceName: string): DatabaseConfig {
    const key = `${serviceName.toUpperCase().replace(/-/g, '_')}_DB_POOL_CONFIG`;
    const raw = process.env[key];

    if (!raw) {
      return this.defaultConfig;
    }

    try {
      return { ...this.defaultConfig, ...JSON.parse(raw) };
    } catch {
      return this.defaultConfig;
    }
  }
}
