import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Inventory } from '@nestcm/proto';

interface InventoryServiceClient {
  checkStock(request: Inventory.CheckStockRequest): Observable<Inventory.CheckStockResponse>;
  getStock(request: Inventory.GetStockRequest): Observable<Inventory.GetStockResponse>;
  getStockLogs(request: Inventory.GetStockLogsRequest): Observable<Inventory.GetStockLogsResponse>;
  importStock(request: Inventory.ImportStockRequest): Observable<Inventory.ImportStockResponse>;
  adjustStock(request: Inventory.AdjustStockRequest): Observable<Inventory.AdjustStockResponse>;
}

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);
  private inventoryServiceClient: InventoryServiceClient;

  constructor(@Inject('INVENTORY_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.inventoryServiceClient = this.client.getService<InventoryServiceClient>('InventoryService');
  }

  async checkStock(skuCodes: string[]): Promise<Inventory.CheckStockResponse> {
    try {
      const request: Inventory.CheckStockRequest = { skuCodes };
      const response = await firstValueFrom(this.inventoryServiceClient.checkStock(request));
      return response;
    } catch (error) {
      this.logger.error(`Failed to check stock: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStock(skuCode: string): Promise<Inventory.GetStockResponse> {
    try {
      const request: Inventory.GetStockRequest = { skuCode };
      const response = await firstValueFrom(this.inventoryServiceClient.getStock(request));
      return response;
    } catch (error) {
      this.logger.error(`Failed to get stock for SKU ${skuCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStockLogs(skuCode: string): Promise<Inventory.GetStockLogsResponse> {
    try {
      const request: Inventory.GetStockLogsRequest = { skuCode };
      const response = await firstValueFrom(this.inventoryServiceClient.getStockLogs(request));
      return response;
    } catch (error) {
      this.logger.error(`Failed to get stock logs for SKU ${skuCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async importStock(
    skuCode: string,
    quantity: number,
    importDetails?: {
      importSource?: string;
      importBatch?: string;
      supplierName?: string;
      importPrice?: number;
      note?: string;
    }
  ): Promise<Inventory.ImportStockResponse> {
    try {
      const request: Inventory.ImportStockRequest = {
        skuCode,
        quantity,
        importDetails: importDetails ? {
          importSource: importDetails.importSource || '',
          importBatch: importDetails.importBatch || '',
          supplierName: importDetails.supplierName || '',
          importPrice: importDetails.importPrice || 0,
          note: importDetails.note || '',
        } : undefined,
      };
      const response = await firstValueFrom(this.inventoryServiceClient.importStock(request));
      return response;
    } catch (error) {
      this.logger.error(`Failed to import stock for SKU ${skuCode}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async adjustStock(skuCode: string, newQuantity: number, reason: string): Promise<Inventory.AdjustStockResponse> {
    try {
      const request: Inventory.AdjustStockRequest = { skuCode, newQuantity, reason };
      const response = await firstValueFrom(this.inventoryServiceClient.adjustStock(request));
      return response;
    } catch (error) {
      this.logger.error(`Failed to adjust stock for SKU ${skuCode}: ${error.message}`, error.stack);
      throw error;
    }
  }
}