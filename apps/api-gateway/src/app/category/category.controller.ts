import { Controller, Get, Post, Body, Param, Put, Delete, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Category } from '@nestcm/proto';

@Controller('categories')
export class CategoryController implements OnModuleInit {
  private readonly logger = new Logger(CategoryController.name);
  private categoryService: Category.CategoryServiceClient;

  constructor(
    @Inject(Category.CATEGORY_PACKAGE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.categoryService = this.client.getService<Category.CategoryServiceClient>('CategoryService');
  }

  @Post()
  async createCategory(@Body() createCategoryDto: Category.CreateCategoryRequest) {
    this.logger.log(`🚀 [CategoryController] Creating category: ${createCategoryDto.name}`);
    
    try {
      const metadata = new Metadata();
      
      // Convert empty string parentId to undefined for UUID field
      const processedDto: Category.CreateCategoryRequest = {
        name: createCategoryDto.name,
        slug: createCategoryDto.slug,
        image: createCategoryDto.image,
        active: createCategoryDto.active,
        parentId: createCategoryDto.parentId === '' ? undefined : createCategoryDto.parentId
      };
      
      const response = await firstValueFrom(this.categoryService.createCategory(processedDto, metadata));
      
      this.logger.log(`✅ [CategoryController] Category created successfully: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [CategoryController] Failed to create category:`, error);
      throw error;
    }
  }

  @Get()
  async getAllCategories() {
    this.logger.log(`🔍 [CategoryController] Getting all categories`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.categoryService.listCategories({
        keyword: '',
        active: true,
        page: 1,
        limit: 100
      }, metadata));
      
      this.logger.log(`✅ [CategoryController] Found ${response.categories?.length || 0} categories`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [CategoryController] Failed to get categories:`, error);
      throw error;
    }
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    this.logger.log(`🔍 [CategoryController] Getting category by ID: ${id}`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.categoryService.getCategory({ 
        id 
      }, metadata));
      
      this.logger.log(`✅ [CategoryController] Category found: ${response.name}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [CategoryController] Failed to get category by ID:`, error);
      throw error;
    }
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: Omit<Category.UpdateCategoryRequest, 'id'>) {
    this.logger.log(`🔄 [CategoryController] Updating category: ${id}`);
    
    try {
      const metadata = new Metadata();
      
      // Convert empty string parentId to undefined for UUID field
      const processedDto: Category.UpdateCategoryRequest = {
        id,
        name: updateCategoryDto.name,
        slug: updateCategoryDto.slug,
        image: updateCategoryDto.image,
        active: updateCategoryDto.active,
        parentId: updateCategoryDto.parentId === '' ? undefined : updateCategoryDto.parentId
      };
      
      const response = await firstValueFrom(this.categoryService.updateCategory(processedDto, metadata));
      
      this.logger.log(`✅ [CategoryController] Category updated successfully: ${id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [CategoryController] Failed to update category:`, error);
      throw error;
    }
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    this.logger.log(`🗑️ [CategoryController] Deleting category: ${id}`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.categoryService.deleteCategory({ 
        id 
      }, metadata));
      
      this.logger.log(`✅ [CategoryController] Category deleted successfully: ${id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [CategoryController] Failed to delete category:`, error);
      throw error;
    }
  }
}