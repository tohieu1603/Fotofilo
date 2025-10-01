import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { BrandEntity } from './infrastructure/entities/brand.entity';
import { BrandTypeOrmRepository } from './infrastructure/repositories/brand.repository';
import { BRAND_REPOSITORY } from './domain/repositories/brand.repository';

import { BrandController } from './brand.controller';

import { CreateBrandHandler } from './application/handlers/create-brand.handler';
import { UpdateBrandHandler } from './application/handlers/update-brand.handler';
import { DeleteBrandHandler } from './application/handlers/delete-brand.handler';
import { GetBrandsHandler as ListBrandsHandler } from './application/handlers/get-brands.handler';
import { GetBrandsHandler as GetBrandByIdHandler } from './application/handlers/get-brand.handler';

const CommandHandlers = [
  CreateBrandHandler,
  UpdateBrandHandler,
  DeleteBrandHandler,
];

const QueryHandlers = [
  ListBrandsHandler,
  GetBrandByIdHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([BrandEntity]),
    CqrsModule,
  ],
  controllers: [BrandController],
  providers: [
    { provide: BRAND_REPOSITORY, useClass: BrandTypeOrmRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [BRAND_REPOSITORY],
})
export class BrandModule {}
