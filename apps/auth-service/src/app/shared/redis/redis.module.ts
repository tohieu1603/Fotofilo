import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
