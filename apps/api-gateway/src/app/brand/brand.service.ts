import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Brand } from '@nestcm/proto';

@Injectable()
export class BrandService implements OnModuleInit {
  private readonly logger = new Logger(BrandService.name);
  private brandService: Brand.BrandServiceClient;

  constructor(
    @Inject(Brand.BRAND_PACKAGE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.brandService = this.client.getService<Brand.BrandServiceClient>('BrandService');
  }

  async createBrand(createBrandDto: Brand.CreateBrandRequest) {
    this.logger.log(`[BrandService] Creating brand: ${createBrandDto.name}`);
    const metadata = new Metadata();
    return firstValueFrom(this.brandService.createBrand(createBrandDto, metadata));
  }

  async getAllBrands() {
    this.logger.log(`[BrandService] Getting all brands`);
    const metadata = new Metadata();
    return firstValueFrom(this.brandService.listBrand({
      keyword: '',
      page: 1,
      limit: 100
    }, metadata));
  }

  async getBrandById(id: string) {
    this.logger.log(`[BrandService] Getting brand by ID: ${id}`);
    const metadata = new Metadata();
    return firstValueFrom(this.brandService.getBrand({ 
      id 
    }, metadata));
  }

  async updateBrand(id: string, updateBrandDto: Omit<Brand.UpdateBrandRequest, 'id'>) {
    this.logger.log(`[BrandService] Updating brand: ${id}`);
    const metadata = new Metadata();
    return firstValueFrom(this.brandService.updateBrand({
      id,
      ...updateBrandDto
    }, metadata));
  }

  async deleteBrand(id: string) {
    this.logger.log(`[BrandService] Deleting brand: ${id}`);
    const metadata = new Metadata();
    return firstValueFrom(this.brandService.deleteBrand({ 
      id 
    }, metadata));
  }
}