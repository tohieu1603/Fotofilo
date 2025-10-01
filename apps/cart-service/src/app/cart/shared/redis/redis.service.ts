import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";


@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis
    ) { }
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redisClient.get(key);
            if (value === null) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            this.logger.error(`Failed to get key ${key}: ${error.message}`);
            throw new Error(`Redis get operation failed for key ${key}`);
        }
    }
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttlSeconds) {
                return await this.redisClient.set(key, serializedValue, 'EX', ttlSeconds);
            }
            return await this.redisClient.set(key, serializedValue);
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
            this.logger.error(`Failed to getOrSet for key ${key}: ${error.message}`);
            throw error;
        }
    }
    async del(key: string): Promise<number> {
        try {
            return await this.redisClient.del(key);
        } catch (error) {
            this.logger.error(`Failed to delete key ${key}: ${error.message}`);
            throw new Error(`Redis delete operation failed for key ${key}`);
        }
    }
    async onModuleDestroy() {
        await this.redisClient.quit();
    }
}