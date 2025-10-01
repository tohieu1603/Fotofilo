import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import {
  InventoryItem,
  InventoryCheckResult,
  InventoryReservationResult,
  InventoryReleaseResult,
  InventoryCommitResult,
  InventoryDetails,
} from './redis.interfaces';

export interface OrderReservationContext {
  orderId: string;
  customerId: string;
  items: InventoryItem[];
  reservationKeys: string[];
  status: 'active' | 'committed' | 'cancelled';
  createdAt: Date;
  timeoutSeconds: number;
}

@Injectable()
export class InventoryManagerService {
  private readonly logger = new Logger(InventoryManagerService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Reserve inventory for an order (used during order creation)
   * This is the main method that should be called from order service
   */
  async reserveForOrder(
    orderId: string,
    customerId: string,
    items: InventoryItem[],
    timeoutSeconds = 300, // 5 minutes default timeout
  ): Promise<{
    success: boolean;
    reservationContext?: OrderReservationContext;
    error?: string;
  }> {
    try {
      this.logger.log(`Reserving inventory for order ${orderId}: ${JSON.stringify(items)}`);

      // Use atomic reservation
      const reservationResult = await this.redisService.checkAndReserveInventory(
        items,
        timeoutSeconds,
      );

      if (!reservationResult.success) {
        this.logger.warn(`Reservation failed for order ${orderId}: ${reservationResult.failureReason}`);
        return {
          success: false,
          error: reservationResult.failureReason,
        };
      }

      // Create order reservation context
      const reservationKeys = reservationResult.reservations
        .filter(r => r.reservationKey)
        .map(r => r.reservationKey!);

      const context: OrderReservationContext = {
        orderId,
        customerId,
        items,
        reservationKeys,
        status: 'active',
        createdAt: new Date(),
        timeoutSeconds,
      };

      // Store order reservation context for tracking
      await this.storeOrderReservationContext(context);

      this.logger.log(`Successfully reserved inventory for order ${orderId}`);
      return {
        success: true,
        reservationContext: context,
      };
    } catch (error) {
      this.logger.error(`Error reserving inventory for order ${orderId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Commit inventory (when order is completed/paid)
   */
  async commitOrderInventory(orderId: string): Promise<{
    success: boolean;
    committed?: Array<{ sku: string; quantity: number }>;
    error?: string;
  }> {
    try {
      this.logger.log(`Committing inventory for order ${orderId}`);

      const context = await this.getOrderReservationContext(orderId);
      if (!context) {
        return {
          success: false,
          error: `Order reservation context not found for order ${orderId}`,
        };
      }

      if (context.status !== 'active') {
        return {
          success: false,
          error: `Order ${orderId} reservation is not active (status: ${context.status})`,
        };
      }

      // Commit using reservation keys
      const commitItems = context.reservationKeys.map(key => ({ reservationKey: key }));
      const commitResult = await this.redisService.commitInventory(commitItems);

      if (commitResult.success) {
        // Update context status
        context.status = 'committed';
        await this.storeOrderReservationContext(context);

        this.logger.log(`Successfully committed inventory for order ${orderId}`);
        return {
          success: true,
          committed: commitResult.committed,
        };
      } else {
        return {
          success: false,
          error: 'Failed to commit inventory',
        };
      }
    } catch (error) {
      this.logger.error(`Error committing inventory for order ${orderId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Release inventory (when order is cancelled)
   */
  async releaseOrderInventory(orderId: string): Promise<{
    success: boolean;
    released?: Array<{ sku: string; quantity: number }>;
    error?: string;
  }> {
    try {
      this.logger.log(`Releasing inventory for order ${orderId}`);

      const context = await this.getOrderReservationContext(orderId);
      if (!context) {
        return {
          success: false,
          error: `Order reservation context not found for order ${orderId}`,
        };
      }

      if (context.status !== 'active') {
        return {
          success: false,
          error: `Order ${orderId} reservation is not active (status: ${context.status})`,
        };
      }

      // Release using reservation keys
      const releaseItems = context.reservationKeys.map(key => ({ reservationKey: key }));
      const releaseResult = await this.redisService.releaseInventory(releaseItems);

      if (releaseResult.success) {
        // Update context status
        context.status = 'cancelled';
        await this.storeOrderReservationContext(context);

        this.logger.log(`Successfully released inventory for order ${orderId}`);
        return {
          success: true,
          released: releaseResult.released,
        };
      } else {
        return {
          success: false,
          error: 'Failed to release inventory',
        };
      }
    } catch (error) {
      this.logger.error(`Error releasing inventory for order ${orderId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check current inventory levels
   */
  async checkInventoryLevels(skus: string[]): Promise<InventoryCheckResult[]> {
    try {
      return await this.redisService.checkInventory(skus);
    } catch (error) {
      this.logger.error('Error checking inventory levels:', error);
      throw new Error(`Failed to check inventory levels: ${error}`);
    }
  }

  /**
   * Get detailed inventory information
   */
  async getInventoryDetails(sku: string): Promise<InventoryDetails | null> {
    try {
      return await this.redisService.getInventoryDetails(sku);
    } catch (error) {
      this.logger.error(`Error getting inventory details for ${sku}:`, error);
      throw new Error(`Failed to get inventory details: ${error}`);
    }
  }

  /**
   * Initialize inventory for a SKU
   */
  async initializeInventory(sku: string, quantity: number): Promise<void> {
    try {
      await this.redisService.setInitialInventory(sku, quantity);
      this.logger.log(`Initialized inventory for ${sku}: ${quantity} units`);
    } catch (error) {
      this.logger.error(`Error initializing inventory for ${sku}:`, error);
      throw new Error(`Failed to initialize inventory: ${error}`);
    }
  }

  /**
   * Update inventory (restocking)
   */
  async restockInventory(sku: string, additionalQuantity: number): Promise<void> {
    try {
      await this.redisService.updateInventory(sku, additionalQuantity);
      this.logger.log(`Restocked inventory for ${sku}: +${additionalQuantity} units`);
    } catch (error) {
      this.logger.error(`Error restocking inventory for ${sku}:`, error);
      throw new Error(`Failed to restock inventory: ${error}`);
    }
  }

  /**
   * Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<number> {
    try {
      const cleaned = await this.redisService.cleanupExpiredReservations();
      if (cleaned > 0) {
        this.logger.log(`Cleaned up ${cleaned} expired reservations`);
      }
      return cleaned;
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get order reservation status
   */
  async getOrderReservationStatus(orderId: string): Promise<OrderReservationContext | null> {
    try {
      return await this.getOrderReservationContext(orderId);
    } catch (error) {
      this.logger.error(`Error getting order reservation status for ${orderId}:`, error);
      return null;
    }
  }

  // Private helper methods

  private async storeOrderReservationContext(context: OrderReservationContext): Promise<void> {
    const key = `order_reservation:${context.orderId}`;
    const ttl = context.timeoutSeconds + 3600; // Extra hour for cleanup

    await this.redisService.getClient().setex(key, ttl, JSON.stringify(context));
  }

  private async getOrderReservationContext(orderId: string): Promise<OrderReservationContext | null> {
    const key = `order_reservation:${orderId}`;
    const data = await this.redisService.getClient().get(key);

    if (!data) {
      return null;
    }

    try {
      const context = JSON.parse(data) as OrderReservationContext;
      context.createdAt = new Date(context.createdAt); // Restore Date object
      return context;
    } catch (error) {
      this.logger.error(`Error parsing order reservation context for ${orderId}:`, error);
      return null;
    }
  }
}