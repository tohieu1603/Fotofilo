import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { resolveProtoPath } from '@nestcm/proto';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'inventory',
          protoPath: resolveProtoPath('proto/inventory.proto'),
          url: process.env.INVENTORY_SERVICE_GRPC_URL || '0.0.0.0:50055',
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}