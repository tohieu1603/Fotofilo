import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from './inventory/inventory.module';
import { InventoryStock, StockLog } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.INVENTORY_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.INVENTORY_SERVICE_PORT) || 5438,
      username: process.env.INVENTORY_SERVICE_USER || 'inventory_user',
      password: process.env.INVENTORY_SERVICE_PASSWORD || 'inventory_pass',
      database: process.env.INVENTORY_SERVICE_NAME || 'inventory_db',
      entities: [InventoryStock, StockLog],
      synchronize: true, // Chỉ dùng trong development
      logging: process.env.NODE_ENV === 'development',
    }),
    InventoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
