import { Logger } from '@nestjs/common';
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

export class DatabaseLogger implements TypeOrmLogger {
  private readonly logger = new Logger('DatabaseLogger');

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.log(`🔍 Query: ${query}`);
    if (parameters && parameters.length) {
      this.logger.log(`📋 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.error('🚨 === QUERY ERROR ===');
    this.logger.error(`💀 Error: ${error}`);
    this.logger.error(`🔍 Failed Query: ${query}`);
    if (parameters && parameters.length) {
      this.logger.error(`📋 Parameters: ${JSON.stringify(parameters, null, 2)}`);
    }

    // Additional error details if available
    if (error instanceof Error) {
      this.logger.error(`📝 Error Name: ${error.name}`);
      this.logger.error(`📝 Error Message: ${error.message}`);
      this.logger.error(`📝 Error Stack: ${error.stack}`);
    }

    this.logger.error('🚨 === END QUERY ERROR ===\n');
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.warn(`🐌 Slow Query (${time}ms): ${query}`);
    if (parameters && parameters.length) {
      this.logger.warn(`📋 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`🏗️ Schema: ${message}`);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.log(`🔄 Migration: ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    switch (level) {
      case 'log':
        this.logger.log(`📄 ${message}`);
        break;
      case 'info':
        this.logger.log(`ℹ️ ${message}`);
        break;
      case 'warn':
        this.logger.warn(`⚠️ ${message}`);
        break;
    }
  }
}