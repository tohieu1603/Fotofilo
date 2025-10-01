import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock/:skuCode')
  async getStock(@Param('skuCode') skuCode: string) {
    this.logger.log(`Getting stock for SKU: ${skuCode}`);
    return this.inventoryService.getStock(skuCode);
  }

  @Get('logs/:skuCode')
  async getStockLogs(@Param('skuCode') skuCode: string) {
    this.logger.log(`Getting stock logs for SKU: ${skuCode}`);
    return this.inventoryService.getStockLogs(skuCode);
  }

  @Post('stock/check')
  async checkStock(@Body() body: { skuCodes: string[] }) {
    this.logger.log(`Checking stock for SKUs: ${body.skuCodes.join(', ')}`);
    return this.inventoryService.checkStock(body.skuCodes);
  }

  @Post('stock/import')
  async importStock(@Body() body: {
    skuCode: string;
    quantity: number;
    importDetails?: {
      importSource?: string;
      importBatch?: string;
      supplierName?: string;
      importPrice?: number;
      note?: string;
    };
  }) {
    this.logger.log(`Manual import request for SKU: ${body.skuCode}, quantity: ${body.quantity}`);
    return this.inventoryService.importStock(body.skuCode, body.quantity, body.importDetails);
  }

  @Post('stock/adjust')
  async adjustStock(@Body() body: {
    skuCode: string;
    newQuantity: number;
    reason: string;
  }) {
    this.logger.log(`Stock adjustment request for SKU: ${body.skuCode}, new quantity: ${body.newQuantity}`);
    return this.inventoryService.adjustStock(body.skuCode, body.newQuantity, body.reason);
  }
}