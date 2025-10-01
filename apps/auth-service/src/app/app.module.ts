import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule, DatabaseService } from '@nestcm/database';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { AddressModule } from './address/address.module';

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
        const config = databaseService.getServiceDatabaseConfig('auth-service');
        console.log('=== DB CONFIG AUTH SERVICE ===', config);

        const pool = databaseService.getPoolConfig('auth-service');

        return {
          type: 'postgres' as const,
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          autoLoadEntities: true,
          // synchronize: process.env.NODE_ENV !== 'production',
          synchronize: false,
          dropSchema: false,
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
    AuthModule,
    AddressModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

