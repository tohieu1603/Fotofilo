import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { OrderModule } from './orders/presentation/order.module';
import { DatabaseModule, DatabaseService } from '@nestcm/database';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { KafkaService } from './common/kafka/kafka.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TypeOrmModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) => {
        const config = databaseService.getServiceDatabaseConfig('order-service');

        const pool = databaseService.getPoolConfig('order-service');

        return {
          type: 'postgres' as const,
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
          extra: {
            connectionTimeoutMillis: pool.connectionTimeout,
            statement_timeout: pool.timeout,
            idleTimeoutMillis: pool.timeout,
            max: pool.maxConnections,
            min: pool.minConnections,
          },
        };
      },
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'order-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'order-consumer-group',
          },
        },
      },
    ]),
    OrderModule,
  ],
  controllers: [],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class AppModule {}
