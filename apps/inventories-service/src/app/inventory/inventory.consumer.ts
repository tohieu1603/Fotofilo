import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { ProductCreatedEventDto } from '../dto/product-created-event.dto';
import { OrderSuccessEventDto } from '../dto/order-success-event.dto';

@Injectable()
export class InventoryConsumer {
  private readonly logger = new Logger(InventoryConsumer.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern('product.created')
  async handleProductCreated(@Payload() data: ProductCreatedEventDto): Promise<void> {
    try {
      this.logger.log(`Received product.created event: ${JSON.stringify(data)}`);
      await this.inventoryService.handleProductCreated(data);
      this.logger.log(`Successfully processed product.created event for product ${data.productId}`);
    } catch (error) {
      this.logger.error(`Failed to process product.created event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @EventPattern('order.success')
  async handleOrderSuccess(@Payload() data: OrderSuccessEventDto): Promise<void> {
    try {
      this.logger.log(`Received order.success event: ${JSON.stringify(data)}`);
      await this.inventoryService.handleOrderSuccess(data);
      this.logger.log(`Successfully processed order.success event for order ${data.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to process order.success event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @EventPattern('inventory.import')
  async handleInventoryImport(@Payload() data: {
    skuCode: string;
    quantity: number;
    importDetails?: {
      importSource?: string;
      importBatch?: string;
      supplierName?: string;
      importPrice?: number;
      note?: string;
    };
  }): Promise<void> {
    try {
      this.logger.log(`Received inventory.import event: ${JSON.stringify(data)}`);
      await this.inventoryService.importStock(data.skuCode, data.quantity, data.importDetails || {});
      this.logger.log(`Successfully processed inventory.import event for SKU ${data.skuCode}`);
    } catch (error) {
      this.logger.error(`Failed to process inventory.import event: ${error.message}`, error.stack);
      throw error;
    }
  }

  @EventPattern('inventory.adjust')
  async handleInventoryAdjust(@Payload() data: {
    skuCode: string;
    newQuantity: number;
    reason: string;
  }): Promise<void> {
    try {
      this.logger.log(`Received inventory.adjust event: ${JSON.stringify(data)}`);
      await this.inventoryService.adjustStock(data.skuCode, data.newQuantity, data.reason);
      this.logger.log(`Successfully processed inventory.adjust event for SKU ${data.skuCode}`);
    } catch (error) {
      this.logger.error(`Failed to process inventory.adjust event: ${error.message}`, error.stack);
      throw error;
    }
  }
}