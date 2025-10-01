import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface InventoryCheckResult {
  sku: string;
  available: number;
  reserved: number;
  total: number;
  canReserve: boolean;
}

export interface InventoryReservationResult {
  success: boolean;
  reservations: Array<{
    sku: string;
    quantity: number;
    reserved: boolean;
    reservationKey?: string;
  }>;
  failureReason?: string;
}

export interface InventoryReleaseResult {
  success: boolean;
  released: Array<{
    sku: string;
    quantity: number;
  }>;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis!: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB', 0),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      this.logger.log('Redis client connected successfully');

      // Load Lua scripts
      await this.loadLuaScripts();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw new Error(`Failed to connect to Redis: ${error}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.logger.log('Redis client disconnected');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  private async loadLuaScripts() {
    // Load atomic inventory check and reserve script
    this.redis.defineCommand('checkAndReserveInventory', {
      numberOfKeys: 0,
      lua: `
        -- ARGV[1] = JSON array of [{sku, quantity}]
        -- ARGV[2] = reservation timeout in seconds (optional, default 300)
        -- Returns: JSON object with success, reservations, failureReason

        local reservations = {}
        local items = cjson.decode(ARGV[1])
        local timeout = ARGV[2] and tonumber(ARGV[2]) or 300
        local currentTime = redis.call('TIME')[1]

        -- First pass: Check if all items can be reserved
        for i, item in ipairs(items) do
          local sku = item.sku
          local quantity = tonumber(item.quantity)

          -- Get current available stock
          local available = redis.call('HGET', 'inventory:' .. sku, 'available')
          if not available then
            return cjson.encode({
              success = false,
              reservations = {},
              failureReason = 'SKU ' .. sku .. ' not found'
            })
          end

          available = tonumber(available) or 0

          if available < quantity then
            return cjson.encode({
              success = false,
              reservations = {},
              failureReason = 'Insufficient stock for SKU ' .. sku .. '. Available: ' .. available .. ', Requested: ' .. quantity
            })
          end
        end

        -- Second pass: Reserve all items atomically
        for i, item in ipairs(items) do
          local sku = item.sku
          local quantity = tonumber(item.quantity)
          local reservationKey = 'reservation:' .. sku .. ':' .. currentTime .. ':' .. i

          -- Decrease available stock
          redis.call('HINCRBY', 'inventory:' .. sku, 'available', -quantity)

          -- Increase reserved stock
          redis.call('HINCRBY', 'inventory:' .. sku, 'reserved', quantity)

          -- Create reservation record with TTL
          redis.call('HMSET', reservationKey,
            'sku', sku,
            'quantity', quantity,
            'created_at', currentTime,
            'status', 'active'
          )
          redis.call('EXPIRE', reservationKey, timeout)

          -- Add to reservations tracking set
          redis.call('SADD', 'reservations:' .. sku, reservationKey)
          redis.call('EXPIRE', 'reservations:' .. sku, timeout + 60)

          table.insert(reservations, {
            sku = sku,
            quantity = quantity,
            reserved = true,
            reservationKey = reservationKey
          })
        end

        return cjson.encode({
          success = true,
          reservations = reservations
        })
      `,
    });

    // Load atomic inventory release script
    this.redis.defineCommand('releaseInventory', {
      numberOfKeys: 0,
      lua: `
        -- ARGV[1] = JSON array of [{sku, quantity}] or [{reservationKey}]
        -- Returns: JSON object with success, released

        local released = {}
        local items = cjson.decode(ARGV[1])

        for i, item in ipairs(items) do
          if item.reservationKey then
            -- Release by reservation key
            local reservationKey = item.reservationKey
            local reservationData = redis.call('HMGET', reservationKey, 'sku', 'quantity', 'status')

            if reservationData[1] and reservationData[2] and reservationData[3] == 'active' then
              local sku = reservationData[1]
              local quantity = tonumber(reservationData[2])

              -- Increase available stock
              redis.call('HINCRBY', 'inventory:' .. sku, 'available', quantity)

              -- Decrease reserved stock
              redis.call('HINCRBY', 'inventory:' .. sku, 'reserved', -quantity)

              -- Mark reservation as released
              redis.call('HSET', reservationKey, 'status', 'released')

              -- Remove from active reservations
              redis.call('SREM', 'reservations:' .. sku, reservationKey)

              table.insert(released, {
                sku = sku,
                quantity = quantity
              })
            end
          else
            -- Release by SKU and quantity (for manual releases)
            local sku = item.sku
            local quantity = tonumber(item.quantity)

            local reserved = redis.call('HGET', 'inventory:' .. sku, 'reserved')
            reserved = tonumber(reserved) or 0

            if reserved >= quantity then
              -- Increase available stock
              redis.call('HINCRBY', 'inventory:' .. sku, 'available', quantity)

              -- Decrease reserved stock
              redis.call('HINCRBY', 'inventory:' .. sku, 'reserved', -quantity)

              table.insert(released, {
                sku = sku,
                quantity = quantity
              })
            end
          end
        end

        return cjson.encode({
          success = true,
          released = released
        })
      `,
    });

    // Load atomic inventory commit script (convert reservation to committed/sold)
    this.redis.defineCommand('commitInventory', {
      numberOfKeys: 0,
      lua: `
        -- ARGV[1] = JSON array of [{reservationKey}] or [{sku, quantity}]
        -- Returns: JSON object with success, committed

        local committed = {}
        local items = cjson.decode(ARGV[1])

        for i, item in ipairs(items) do
          if item.reservationKey then
            -- Commit by reservation key
            local reservationKey = item.reservationKey
            local reservationData = redis.call('HMGET', reservationKey, 'sku', 'quantity', 'status')

            if reservationData[1] and reservationData[2] and reservationData[3] == 'active' then
              local sku = reservationData[1]
              local quantity = tonumber(reservationData[2])

              -- Decrease reserved stock (don't increase available - it's sold)
              redis.call('HINCRBY', 'inventory:' .. sku, 'reserved', -quantity)

              -- Increase sold count for tracking
              redis.call('HINCRBY', 'inventory:' .. sku, 'sold', quantity)

              -- Mark reservation as committed
              redis.call('HSET', reservationKey, 'status', 'committed')

              -- Remove from active reservations
              redis.call('SREM', 'reservations:' .. sku, reservationKey)

              table.insert(committed, {
                sku = sku,
                quantity = quantity
              })
            end
          else
            -- Direct commit by SKU and quantity
            local sku = item.sku
            local quantity = tonumber(item.quantity)

            local available = redis.call('HGET', 'inventory:' .. sku, 'available')
            available = tonumber(available) or 0

            if available >= quantity then
              -- Decrease available stock
              redis.call('HINCRBY', 'inventory:' .. sku, 'available', -quantity)

              -- Increase sold count
              redis.call('HINCRBY', 'inventory:' .. sku, 'sold', quantity)

              table.insert(committed, {
                sku = sku,
                quantity = quantity
              })
            end
          end
        end

        return cjson.encode({
          success = true,
          committed = committed
        })
      `,
    });

    // Load inventory check script
    this.redis.defineCommand('checkInventory', {
      numberOfKeys: 0,
      lua: `
        -- ARGV[1] = JSON array of SKU codes
        -- Returns: JSON array of inventory status for each SKU

        local results = {}
        local skus = cjson.decode(ARGV[1])

        for i, sku in ipairs(skus) do
          local inventoryData = redis.call('HMGET', 'inventory:' .. sku, 'available', 'reserved', 'total')
          local available = tonumber(inventoryData[1]) or 0
          local reserved = tonumber(inventoryData[2]) or 0
          local total = tonumber(inventoryData[3]) or 0

          table.insert(results, {
            sku = sku,
            available = available,
            reserved = reserved,
            total = total,
            canReserve = available > 0
          })
        end

        return cjson.encode(results)
      `,
    });

    this.logger.log('Lua scripts loaded successfully');
  }

  /**
   * Atomically check and reserve inventory for multiple SKUs
   */
  async checkAndReserveInventory(
    items: Array<{ sku: string; quantity: number }>,
    timeoutSeconds = 300,
  ): Promise<InventoryReservationResult> {
    try {
      const result = await (this.redis as any).checkAndReserveInventory(
        JSON.stringify(items),
        timeoutSeconds.toString(),
      );
      return JSON.parse(result);
    } catch (error) {
      this.logger.error('Error in checkAndReserveInventory:', error);
      throw new Error(`Failed to check and reserve inventory: ${error}`);
    }
  }

  /**
   * Release reserved inventory (cancel reservations)
   */
  async releaseInventory(
    items: Array<{ sku: string; quantity: number } | { reservationKey: string }>,
  ): Promise<InventoryReleaseResult> {
    try {
      const result = await (this.redis as any).releaseInventory(JSON.stringify(items));
      return JSON.parse(result);
    } catch (error) {
      this.logger.error('Error in releaseInventory:', error);
      throw new Error(`Failed to release inventory: ${error}`);
    }
  }

  /**
   * Commit reserved inventory (complete the sale)
   */
  async commitInventory(
    items: Array<{ sku: string; quantity: number } | { reservationKey: string }>,
  ): Promise<{ success: boolean; committed: Array<{ sku: string; quantity: number }> }> {
    try {
      const result = await (this.redis as any).commitInventory(JSON.stringify(items));
      return JSON.parse(result);
    } catch (error) {
      this.logger.error('Error in commitInventory:', error);
      throw new Error(`Failed to commit inventory: ${error}`);
    }
  }

  /**
   * Check inventory levels for multiple SKUs
   */
  async checkInventory(skus: string[]): Promise<InventoryCheckResult[]> {
    try {
      const result = await (this.redis as any).checkInventory(JSON.stringify(skus));
      return JSON.parse(result);
    } catch (error) {
      this.logger.error('Error in checkInventory:', error);
      throw new Error(`Failed to check inventory: ${error}`);
    }
  }

  /**
   * Set initial inventory for a SKU
   */
  async setInitialInventory(sku: string, quantity: number): Promise<void> {
    try {
      await this.redis.hmset(`inventory:${sku}`, {
        available: quantity,
        reserved: 0,
        total: quantity,
        sold: 0,
      });
      this.logger.log(`Initial inventory set for ${sku}: ${quantity}`);
    } catch (error) {
      this.logger.error('Error setting initial inventory:', error);
      throw new Error(`Failed to set initial inventory: ${error}`);
    }
  }

  /**
   * Update total inventory (for restocking)
   */
  async updateInventory(sku: string, additionalQuantity: number): Promise<void> {
    try {
      await this.redis
        .multi()
        .hincrby(`inventory:${sku}`, 'available', additionalQuantity)
        .hincrby(`inventory:${sku}`, 'total', additionalQuantity)
        .exec();
      this.logger.log(`Inventory updated for ${sku}: +${additionalQuantity}`);
    } catch (error) {
      this.logger.error('Error updating inventory:', error);
      throw new Error(`Failed to update inventory: ${error}`);
    }
  }

  /**
   * Get detailed inventory information for a SKU
   */
  async getInventoryDetails(sku: string): Promise<{
    available: number;
    reserved: number;
    total: number;
    sold: number;
  } | null> {
    try {
      const result = await this.redis.hmget(
        `inventory:${sku}`,
        'available',
        'reserved',
        'total',
        'sold',
      );

      if (!result[0] && !result[1] && !result[2] && !result[3]) {
        return null;
      }

      return {
        available: parseInt(result[0] || '0') || 0,
        reserved: parseInt(result[1] || '0') || 0,
        total: parseInt(result[2] || '0') || 0,
        sold: parseInt(result[3] || '0') || 0,
      };
    } catch (error) {
      this.logger.error('Error getting inventory details:', error);
      throw new Error(`Failed to get inventory details: ${error}`);
    }
  }

  /**
   * Clean up expired reservations (should be run periodically)
   */
  async cleanupExpiredReservations(): Promise<number> {
    try {
      const keys = await this.redis.keys('reservation:*');
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -2) {
          // Key expired, clean up
          const reservationData = await this.redis.hmget(key, 'sku', 'quantity', 'status');
          if (reservationData[0] && reservationData[1] && reservationData[2] === 'active') {
            const sku = reservationData[0];
            const quantity = parseInt(reservationData[1]);

            // Release the reservation
            await this.releaseInventory([{ reservationKey: key }]);
            cleaned++;
          }
        }
      }

      this.logger.log(`Cleaned up ${cleaned} expired reservations`);
      return cleaned;
    } catch (error) {
      this.logger.error('Error cleaning up expired reservations:', error);
      throw new Error(`Failed to cleanup expired reservations: ${error}`);
    }
  }

  /**
   * Get Redis client for custom operations
   */
  getClient(): Redis {
    return this.redis;
  }
}