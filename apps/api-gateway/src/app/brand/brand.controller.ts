import { Controller, Get, Post, Body, Param, Put, Delete, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Brand } from '@nestcm/proto';

@Controller('brands')
export class BrandController implements OnModuleInit {
  private readonly logger = new Logger(BrandController.name);
  private brandService: Brand.BrandServiceClient;

  constructor(
    @Inject(Brand.BRAND_PACKAGE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.brandService = this.client.getService<Brand.BrandServiceClient>('BrandService');
  }

  @Post()
  async createBrand(@Body() createBrandDto: Brand.CreateBrandRequest) {
    this.logger.log(`🚀 [BrandController] Creating brand: ${createBrandDto.name}`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.brandService.createBrand(createBrandDto, metadata));
      
      this.logger.log(`✅ [BrandController] Brand created successfully: ${response.id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [BrandController] Failed to create brand:`, error);
      throw error;
    }
  }

  @Get()
  async getAllBrands() {
    this.logger.log(`🔍 [BrandController] Getting all brands`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.brandService.listBrand({
        keyword: '',
        page: 1,
        limit: 100
      }, metadata));
      
      this.logger.log(`✅ [BrandController] Found ${response.brand?.length || 0} brands`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [BrandController] Failed to get brands:`, error);
      throw error;
    }
  }

  @Get(':id')
  async getBrandById(@Param('id') id: string) {
    this.logger.log(`🔍 [BrandController] Getting brand by ID: ${id}`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.brandService.getBrand({ 
        id 
      }, metadata));
      
      this.logger.log(`✅ [BrandController] Brand found: ${response.name}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [BrandController] Failed to get brand by ID:`, error);
      throw error;
    }
  }

  @Put(':id')
  async updateBrand(@Param('id') id: string, @Body() updateBrandDto: Omit<Brand.UpdateBrandRequest, 'id'>) {
    this.logger.log(`🔄 [BrandController] Updating brand: ${id}`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.brandService.updateBrand({
        id,
        ...updateBrandDto
      }, metadata));
      
      this.logger.log(`✅ [BrandController] Brand updated successfully: ${id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [BrandController] Failed to update brand:`, error);
      throw error;
    }
  }

  @Delete(':id')
  async deleteBrand(@Param('id') id: string) {
    this.logger.log(`🗑️ [BrandController] Deleting brand: ${id}`);
    
    try {
      const metadata = new Metadata();
      const response = await firstValueFrom(this.brandService.deleteBrand({ 
        id 
      }, metadata));
      
      this.logger.log(`✅ [BrandController] Brand deleted successfully: ${id}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ [BrandController] Failed to delete brand:`, error);
      throw error;
    }
  }
}