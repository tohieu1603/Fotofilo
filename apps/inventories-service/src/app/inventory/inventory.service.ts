import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryStock, StockLog } from '../entities';
import { StockLogType } from '../enums/stock-log-type.enum';
import { ProductCreatedEventDto } from '../dto/product-created-event.dto';
import { OrderSuccessEventDto } from '../dto/order-success-event.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryStock)
    private readonly inventoryStockRepository: Repository<InventoryStock>,
    @InjectRepository(StockLog)
    private readonly stockLogRepository: Repository<StockLog>,
    private readonly dataSource: DataSource,
  ) {}

  async handleProductCreated(event: ProductCreatedEventDto): Promise<void> {
    this.logger.log(`Processing product created event for product ${event.productId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const sku of event.skus) {
        let inventoryStock = await queryRunner.manager.findOne(InventoryStock, {
          where: { skuCode: sku.skuCode },
        });

        if (!inventoryStock) {
          inventoryStock = queryRunner.manager.create(InventoryStock, {
            skuId: sku.id,
            skuCode: sku.skuCode,
            stock: sku.initialStock || 0,
          });
          inventoryStock = await queryRunner.manager.save(inventoryStock);

          if (sku.initialStock && sku.initialStock > 0) {
            const stockLog = queryRunner.manager.create(StockLog, {
              skuId: sku.id,
              skuCode: sku.skuCode,
              type: StockLogType.IMPORT,
              stock: sku.initialStock,
              beforeQuantity: 0,
              afterQuantity: sku.initialStock,
              importSource: sku.importSource,
              importBatch: sku.importBatch,
              supplierName: sku.supplierName,
              importPrice: sku.importPrice,
              note: 'Initial stock import when product created',
            });
            await queryRunner.manager.save(stockLog);
          }
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully processed product created event for product ${event.productId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process product created event: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handleOrderSuccess(event: OrderSuccessEventDto): Promise<void> {
    this.logger.log(`Processing order success event for order ${event.orderId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of event.items) {
        const inventoryStock = await queryRunner.manager.findOne(InventoryStock, {
          where: { skuCode: item.skuCode },
          lock: { mode: 'pessimistic_write' }, 
        });

        if (!inventoryStock) {
          throw new Error(`Inventory stock not found for SKU: ${item.skuCode}`);
        }

        if (inventoryStock.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for SKU: ${item.skuCode}. Available: ${inventoryStock.stock}, Required: ${item.quantity}`
          );
        }

        const beforeQuantity = inventoryStock.stock;
        const afterQuantity = beforeQuantity - item.quantity;

        // Cập nhật stock
        inventoryStock.stock = afterQuantity;
        await queryRunner.manager.save(inventoryStock);

        // Tạo log xuất kho
        const stockLog = queryRunner.manager.create(StockLog, {
          skuId: item.skuId,
          skuCode: item.skuCode,
          type: StockLogType.ORDER,
          stock: item.quantity,
          beforeQuantity,
          afterQuantity,
          referenceId: event.orderId,
          note: `Stock deducted for order ${event.orderNumber}`,
        });
        await queryRunner.manager.save(stockLog);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully processed order success event for order ${event.orderId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process order success event: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async importStock(
    skuCode: string,
    quantity: number,
    importDetails: {
      importSource?: string;
      importBatch?: string;
      supplierName?: string;
      importPrice?: number;
      note?: string;
    } = {}
  ): Promise<void> {
    this.logger.log(`Importing ${quantity} units for SKU: ${skuCode}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventoryStock = await queryRunner.manager.findOne(InventoryStock, {
        where: { skuCode },
        lock: { mode: 'pessimistic_write' },
      });

      if (!inventoryStock) {
        throw new Error(`Inventory stock not found for SKU: ${skuCode}`);
      }

      const beforeQuantity = inventoryStock.stock;
      const afterQuantity = beforeQuantity + quantity;

      inventoryStock.stock = afterQuantity;
      await queryRunner.manager.save(inventoryStock);

      const stockLog = queryRunner.manager.create(StockLog, {
        skuId: inventoryStock.skuId,
        skuCode,
        type: StockLogType.IMPORT,
        stock: quantity,
        beforeQuantity,
        afterQuantity,
        importSource: importDetails.importSource,
        importBatch: importDetails.importBatch,
        supplierName: importDetails.supplierName,
        importPrice: importDetails.importPrice,
        note: importDetails.note || `Manual import of ${quantity} units`,
      });
      await queryRunner.manager.save(stockLog);

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully imported ${quantity} units for SKU: ${skuCode}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to import stock: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStockBySku(skuCode: string): Promise<InventoryStock | null> {
    return this.inventoryStockRepository.findOne({
      where: { skuCode },
      relations: ['stockLogs'],
    });
  }

  async getStockLogs(skuCode: string): Promise<StockLog[]> {
    return this.stockLogRepository.find({
      where: { skuCode },
      order: { createdAt: 'DESC' },
    });
  }

  async adjustStock(
    skuCode: string,
    newQuantity: number,
    reason: string
  ): Promise<void> {
    this.logger.log(`Adjusting stock for SKU: ${skuCode} to ${newQuantity}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventoryStock = await queryRunner.manager.findOne(InventoryStock, {
        where: { skuCode },
        lock: { mode: 'pessimistic_write' },
      });

      if (!inventoryStock) {
        throw new Error(`Inventory stock not found for SKU: ${skuCode}`);
      }

      const beforeQuantity = inventoryStock.stock;
      const difference = newQuantity - beforeQuantity;

      // Cập nhật stock
      inventoryStock.stock = newQuantity;
      await queryRunner.manager.save(inventoryStock);

      // Tạo log điều chỉnh
      const stockLog = queryRunner.manager.create(StockLog, {
        skuId: inventoryStock.skuId,
        skuCode,
        type: StockLogType.ADJUSTMENT,
        stock: Math.abs(difference),
        beforeQuantity,
        afterQuantity: newQuantity,
        note: `Stock adjustment: ${reason}. Change: ${difference > 0 ? '+' : ''}${difference}`,
      });
      await queryRunner.manager.save(stockLog);

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully adjusted stock for SKU: ${skuCode} to ${newQuantity}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to adjust stock: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}