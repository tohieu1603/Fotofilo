import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryCommand,
  GetCategoryQuery,
  ListCategoriesQuery,
} from '../application';
import { CategoryMapper } from '../infrastructure/mappers/category.mapper';
import { CategoryListResponse, CategoryResponse, CategoryServiceController, CategoryServiceControllerMethods, CreateCategoryRequest, DeleteCategoryRequest, GetCategoryRequest, ListCategoriesRequest, UpdateCategoryRequest } from 'libs/proto/src/generated/category';

@Controller()
@CategoryServiceControllerMethods()
export class CategoryController implements CategoryServiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
    const command = new CreateCategoryCommand(
      request.name,
      request.slug,
      request.image,
      request.active,
      request.parentId,
    );

    const category = await this.commandBus.execute(command);

    return CategoryMapper.toResponse(category);
  }

  async updateCategory(request: UpdateCategoryRequest): Promise<CategoryResponse> {
    const command = new UpdateCategoryCommand(
      request.id,
      request.name,
      request.slug,
      request.image,
      request.active,
      request.parentId,
    );

    const category = await this.commandBus.execute(command);

    return CategoryMapper.toResponse(category);
  }

  async deleteCategory(request: DeleteCategoryRequest): Promise<CategoryResponse> {
    const command = new DeleteCategoryCommand(request.id);
    await this.commandBus.execute(command);

    // Return empty response with required fields
    return {
      id: request.id,
      name: '',
      slug: '',
      image: '',
      active: false,
      parentId: '',
    };
  }

  async getCategory(request: GetCategoryRequest): Promise<CategoryResponse> {
    const query = new GetCategoryQuery(request.id);
    const category = await this.queryBus.execute(query);

    return CategoryMapper.toResponse(category);
  }

  async listCategories(request: ListCategoriesRequest): Promise<CategoryListResponse> {
    const query = new ListCategoriesQuery(
      request.page || 1,
      request.limit || 10,
      'createdAt', // Default sorting field
      'DESC', // Default sorting order
      undefined, // No parentId in request
    );

    const result = await this.queryBus.execute(query);

    return {
      categories: result.data.map((c) => CategoryMapper.toProto(c)),
      total: result.pagination.totalItems,
    };
  }

  // REST endpoints
  @Post('categories')
  async createCategoryRest(@Body() body: { name: string; slug: string; image?: string; active: boolean; parentId?: string }): Promise<CategoryResponse> {
    const command = new CreateCategoryCommand(
      body.name,
      body.slug,
      body.image,
      body.active,
      body.parentId,
    );
    const category = await this.commandBus.execute(command);
    return CategoryMapper.toResponse(category);
  }

  @Put('categories/:id')
  async updateCategoryRest(@Param('id') id: string, @Body() body: { name?: string; slug?: string; image?: string; active?: boolean; parentId?: string }): Promise<CategoryResponse> {
    const command = new UpdateCategoryCommand(
      id,
      body.name,
      body.slug,
      body.image,
      body.active,
      body.parentId,
    );
    const category = await this.commandBus.execute(command);
    return CategoryMapper.toResponse(category);
  }

  @Delete('categories/:id')
  async deleteCategoryRest(@Param('id') id: string): Promise<CategoryResponse> {
    const command = new DeleteCategoryCommand(id);
    await this.commandBus.execute(command);
    return {
      id,
      name: '',
      slug: '',
      image: '',
      active: false,
      parentId: '',
    };
  }

  @Get('categories/:id')
  async getCategoryRest(@Param('id') id: string): Promise<CategoryResponse> {
    const query = new GetCategoryQuery(id);
    const category = await this.queryBus.execute(query);
    return CategoryMapper.toResponse(category);
  }

  @Get('categories')
  async listCategoriesRest(): Promise<CategoryResponse[]> {
    const query = new ListCategoriesQuery(1, 100, 'createdAt', 'DESC', undefined);
    const result = await this.queryBus.execute(query);
    return result.data.map((c) => CategoryMapper.toResponse(c));
  }
}
