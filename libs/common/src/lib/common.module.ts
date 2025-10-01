import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis/redis.service';
import { InventoryManagerService } from './redis/inventory-manager.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [RedisService, InventoryManagerService],
  exports: [RedisService, InventoryManagerService],
})
export class CommonModule {}
