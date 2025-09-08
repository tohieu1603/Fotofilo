import { Inject, Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Service for interacting with Redis
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  /**
   * Retrieves a value from Redis by key
   * @param key The cache key
   * @returns The deserialized value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get key ${key}: ${error.message}`);
      throw new Error(`Redis get operation failed for key ${key}`);
    }
  }

  /**
   * Sets a value in Redis with optional TTL
   * @param key The cache key
   * @param value The value to cache
   * @param ttlSeconds Optional time-to-live in seconds
   * @returns 'OK' on success, null on failure
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        return await this.client.set(key, serializedValue, 'EX', ttlSeconds);
      }
      return await this.client.set(key, serializedValue);
    } catch (error) {
      this.logger.error(`Failed to set key ${key}: ${error.message}`);
      throw new Error(`Redis set operation failed for key ${key}`);
    }
  }
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        this.logger.debug(`Cache hit for key ${key}`);
        return cached;
      }
      this.logger.debug(`Cache miss for key ${key}`);
      const data = await callback();
      await this.set(key, data, ttlSeconds);
      return data;
    } catch (error) {
      this.logger.error(`Failed to get or set key ${key}: ${error.message}`);
      throw new Error(`Redis get or set operation failed for key ${key}`);
    }
  }

  /**
   * Deletes a key from Redis
   * @param key The cache key
   * @returns Number of keys deleted
   */
  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}: ${error.message}`);
      throw new Error(`Redis delete operation failed for key ${key}`);
    }
  }

  /**
   * Invalidates keys matching a prefix
   * @param prefix The prefix to match keys
   * @returns Number of keys deleted
   */
  async invalidateByPrefix(prefix: string): Promise<number> {
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Failed to invalidate keys with prefix ${prefix}: ${error.message}`);
      throw new Error(`Redis invalidateByPrefix operation failed for prefix ${prefix}`);
    }
  }

  /**
   * Closes the Redis connection when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error(`Failed to close Redis connection: ${error.message}`);
    }
  }
}