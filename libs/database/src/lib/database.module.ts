import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DATABASE_CONFIG',
      useFactory: () => ({
        connectionTimeout: 30000,
        acquireTimeout: 30000,
        timeout: 30000,
        maxConnections: 10,
        minConnections: 2,
      }),
    },
    DatabaseService,
  ],
  exports: ['DATABASE_CONFIG', DatabaseService],
})
export class DatabaseModule {}
