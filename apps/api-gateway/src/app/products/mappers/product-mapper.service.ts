import { Injectable } from '@nestjs/common';
import { Product } from '@nestcm/proto';
import { ProductDto, SkuDto, AttributeDto } from '../dto';

@Injectable()
export class ProductMapperService {
  
  /**
   * Convert proto to DTO - Main mapper
   */
  fromProtoToDto(grpcProduct: Product.GetProductResponse): ProductDto {
    const skus = this.mapSkus(grpcProduct.skus);
    const firstSkuPrice = skus.length > 0 ? skus[0].price : 0;
    
    return {
      id: grpcProduct.id || '',
      name: grpcProduct.name || '',
      description: grpcProduct.description || '',
      slug: grpcProduct.name?.toLowerCase().replace(/\s+/g, '-') || '',
      price: firstSkuPrice,
      brandId: grpcProduct.brandId || '',
      categoryId: grpcProduct.categoryId || '',
      skus,
      images: [],
      attributes: this.buildAttributeSummary(skus),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert DTO to proto - Request mapper
   */
  fromDtoToProto(body: any): Product.CreateProductRequest {
    return body as unknown as Product.CreateProductRequest;
  }

  /**
   * Create empty DTO - Simple response
   */
  createEmptyDto(id: string, name: string): ProductDto {
    return {
      id,
      name,
      description: '',
      price: 0,
      brandId: '',
      categoryId: '',
      skus: [],
      images: [],
      attributes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Private helper methods
   */
  private mapSkus(grpcSkus: Product.SkuResponse[] = []): SkuDto[] {
    return grpcSkus.map(sku => ({
      id: sku.id || '',
      skuCode: sku.skuCode || '',
      price: sku.price || 0,
      stock: sku.stock || 0,
      image: sku.image || '',
      attributes: this.mapAttributes(sku.skuOptions)
    }));
  }

  private mapAttributes(skuOptions: Product.SkuOptionResponse[] = []): AttributeDto[] {
    return skuOptions.map(opt => ({
      attributeOptionId: opt.attributeOptionId || '',
      attributeOptionValue: opt.attributeOptionValue || '',
      attribute: {
        id: opt.attribute?.id || '',
        name: opt.attribute?.name || '',
        description: opt.attribute?.description
      }
    }));
  }

  private buildAttributeSummary(skus: SkuDto[]): Record<string, string[]> {
    const summary: Record<string, string[]> = {};
    
    skus.forEach(sku => {
      sku.attributes?.forEach(attr => {
        const attributeName = attr.attribute.name;
        if (attributeName) {
          if (!summary[attributeName]) {
            summary[attributeName] = [];
          }
          if (!summary[attributeName].includes(attr.attributeOptionValue)) {
            summary[attributeName].push(attr.attributeOptionValue);
          }
        }
      });
    });
    
    return summary;
  }
  
}