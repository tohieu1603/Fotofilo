
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InventoryService } from './inventory.service';
import { Inventory } from '@nestcm/proto';
import { StockLogType } from '../enums/stock-log-type.enum';

@Controller()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  @GrpcMethod('InventoryService', 'CheckStock')
  async checkStock(request: Inventory.CheckStockRequest): Promise<Inventory.CheckStockResponse> {
    this.logger.log(`Checking stock for SKUs: ${request.skuCodes.join(', ')}`);

    const items = [];
    for (const skuCode of request.skuCodes) {
      const stock = await this.inventoryService.getStockBySku(skuCode);
      items.push({
        skuCode,
        stock: stock?.stock || 0
      });
    }

    return { items };
  }

  @GrpcMethod('InventoryService', 'GetStock')
  async getStock(request: Inventory.GetStockRequest): Promise<Inventory.GetStockResponse> {
    this.logger.log(`Getting detailed stock for SKU: ${request.skuCode}`);

    const stock = await this.inventoryService.getStockBySku(request.skuCode);

    if (!stock) {
      return { stock: null };
    }

    const protoStock: Inventory.InventoryStock = {
      id: stock.id,
      skuId: stock.skuId,
      skuCode: stock.skuCode,
      stock: stock.stock,
      createdAt: stock.createdAt.toISOString(),
      updatedAt: stock.updatedAt.toISOString(),
    };

    return { stock: protoStock };
  }

  @GrpcMethod('InventoryService', 'GetStockLogs')
  async getStockLogs(request: Inventory.GetStockLogsRequest): Promise<Inventory.GetStockLogsResponse> {
    this.logger.log(`Getting stock logs for SKU: ${request.skuCode}`);

    const logs = await this.inventoryService.getStockLogs(request.skuCode);

    const protoLogs: Inventory.StockLog[] = logs.map(log => ({
      id: log.id,
      skuId: log.skuId,
      skuCode: log.skuCode,
      type: this.mapStockLogTypeToProto(log.type),
      stock: log.stock,
      beforeQuantity: log.beforeQuantity,
      afterQuantity: log.afterQuantity,
      referenceId: log.referenceId || '',
      note: log.note || '',
      importSource: log.importSource || '',
      importBatch: log.importBatch || '',
      supplierName: log.supplierName || '',
      importPrice: log.importPrice || 0,
      createdAt: log.createdAt.toISOString(),
    }));

    return { logs: protoLogs };
  }

  @GrpcMethod('InventoryService', 'ImportStock')
  async importStock(request: Inventory.ImportStockRequest): Promise<Inventory.ImportStockResponse> {
    this.logger.log(`Importing stock for SKU: ${request.skuCode}, quantity: ${request.quantity}`);

    try {
      const importDetails = request.importDetails ? {
        importSource: request.importDetails.importSource,
        importBatch: request.importDetails.importBatch,
        supplierName: request.importDetails.supplierName,
        importPrice: request.importDetails.importPrice,
        note: request.importDetails.note,
      } : {};

      await this.inventoryService.importStock(request.skuCode, request.quantity, importDetails);

      return {
        success: true,
        message: `Successfully imported ${request.quantity} units for SKU: ${request.skuCode}`,
      };
    } catch (error) {
      this.logger.error(`Failed to import stock: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to import stock: ${error.message}`,
      };
    }
  }

  @GrpcMethod('InventoryService', 'AdjustStock')
  async adjustStock(request: Inventory.AdjustStockRequest): Promise<Inventory.AdjustStockResponse> {
    this.logger.log(`Adjusting stock for SKU: ${request.skuCode}, new quantity: ${request.newQuantity}`);

    try {
      await this.inventoryService.adjustStock(request.skuCode, request.newQuantity, request.reason);

      return {
        success: true,
        message: `Successfully adjusted stock for SKU: ${request.skuCode} to ${request.newQuantity}`,
      };
    } catch (error) {
      this.logger.error(`Failed to adjust stock: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to adjust stock: ${error.message}`,
      };
    }
  }

  private mapStockLogTypeToProto(type: StockLogType): Inventory.StockLogType {
    switch (type) {
      case StockLogType.IMPORT:
        return Inventory.StockLogType.IMPORT;
      case StockLogType.EXPORT:
        return Inventory.StockLogType.EXPORT;
      case StockLogType.ADJUSTMENT:
        return Inventory.StockLogType.ADJUSTMENT;
      case StockLogType.ROLLBACK:
        return Inventory.StockLogType.ROLLBACK;
      case StockLogType.ORDER:
        return Inventory.StockLogType.ORDER;
      case StockLogType.FLASH_SALE:
        return Inventory.StockLogType.FLASH_SALE;
      default:
        return Inventory.StockLogType.IMPORT;
    }
  }
}