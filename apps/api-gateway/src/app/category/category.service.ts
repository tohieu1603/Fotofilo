import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Category } from '@nestcm/proto';

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly logger = new Logger(CategoryService.name);
  private categoryService: Category.CategoryServiceClient;

  constructor(
    @Inject(Category.CATEGORY_PACKAGE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.categoryService = this.client.getService<Category.CategoryServiceClient>('CategoryService');
  }

  async createCategory(createCategoryDto: Category.CreateCategoryRequest) {
    this.logger.log(`[CategoryService] Creating category: ${createCategoryDto.name}`);
    const metadata = new Metadata();
    
    // Convert empty string parentId to undefined for UUID field
    const requestWithType = {
      ...createCategoryDto,
      parentId: createCategoryDto.parentId === '' ? undefined : createCategoryDto.parentId
    };
    
    return firstValueFrom(this.categoryService.createCategory(requestWithType, metadata));
  }

  async getAllCategories() {
    this.logger.log(`[CategoryService] Getting all categories`);
    const metadata = new Metadata();
    return firstValueFrom(this.categoryService.listCategories({
      keyword: '',
      active: true,
      page: 1,
      limit: 100
    }, metadata));
  }

  async getCategoryById(id: string) {
    this.logger.log(`[CategoryService] Getting category by ID: ${id}`);
    const metadata = new Metadata();
    return firstValueFrom(this.categoryService.getCategory({ 
      id 
    }, metadata));
  }

  async updateCategory(id: string, updateCategoryDto: Omit<Category.UpdateCategoryRequest, 'id'>) {
    this.logger.log(`[CategoryService] Updating category: ${id}`);
    const metadata = new Metadata();
    
    // Convert empty string parentId to undefined for UUID field
    const processedDto = {
      ...updateCategoryDto,
      parentId: updateCategoryDto.parentId === '' ? undefined : updateCategoryDto.parentId
    };
    
    return firstValueFrom(this.categoryService.updateCategory({
      id,
      ...processedDto
    }, metadata));
  }

  async deleteCategory(id: string) {
    this.logger.log(`[CategoryService] Deleting category: ${id}`);
    const metadata = new Metadata();
    return firstValueFrom(this.categoryService.deleteCategory({ 
      id 
    }, metadata));
  }
}