import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoryEntity } from './infrastructure/entities/category.entity';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository';
import { CategoryController } from './presentation/category.grpc.controller';
import {
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
  GetCategoryHandler,
  ListCategoriesHandler
} from './application/handlers';

const CommandHandlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler
];

const QueryHandlers = [
  GetCategoryHandler,
  ListCategoriesHandler
];

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
    CqrsModule
  ],
  controllers: [CategoryController],
  providers: [
    { provide: CATEGORY_REPOSITORY, useClass: CategoryRepository },
    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [CATEGORY_REPOSITORY]
})
export class CategoryModule {}
