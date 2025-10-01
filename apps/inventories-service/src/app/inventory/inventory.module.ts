import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryConsumer } from './inventory.consumer';
import { InventoryStock, StockLog } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryStock, StockLog]),
  ],
  controllers: [InventoryController, InventoryConsumer],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}