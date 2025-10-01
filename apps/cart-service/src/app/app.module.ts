import { DatabaseModule, DatabaseService } from '@nestcm/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartModule } from './cart/cart.module';
import { KafkaModule } from './cart/shared/kafka/kafka.module';
import { RedisModule } from './cart/shared/redis/redis.module';
import { CartEntity, CartItemEntity } from './cart/infrastructure/entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DatabaseService],

      useFactory: (databaseService: DatabaseService) => {
        const config = databaseService.getServiceDatabaseConfig('cart-service')

        const pool = databaseService.getPoolConfig('cart-service');

        return {
          type: 'postgres' as const,
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          entities: [CartEntity, CartItemEntity],
          synchronize: false,
          dropSchema: false,
          // synchronize: process.env.NODE_ENV !== 'production',
          // dropSchema: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
          extra: {
            connectionTimeoutMillis: pool.connectionTimeout,
            statement_timeout: pool.timeout,
            idleTimeoutMillis: pool.timeout,
            max: pool.maxConnections,
            min: pool.minConnections,
          },
        };
      }
    }),
    CartModule,
    KafkaModule,
    RedisModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
