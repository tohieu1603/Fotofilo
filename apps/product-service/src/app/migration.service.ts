import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService implements OnModuleInit {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      console.log('Running migration: Add originalPrice column...');

      await this.dataSource.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS "originalPrice" NUMERIC(10,2);
      `);

      console.log('✅ Migration completed: originalPrice column added');

      // Verify
      const result = await this.dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'originalPrice';
      `);

      console.log('Column info:', result);
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
    }
  }
}
