import { Product } from '../entities/product.entity';
import {
  GetProductResponse,
  SkuResponse,
  SkuOptionResponse,
  AttributeDetail,
} from '@nestcm/proto';

export class ProductMapper {
  static toResponse(product: Product): GetProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      brandId: product.brandId,
      categoryId: product.categoryId,
      skus: product.skus.map(
        (sku): SkuResponse => ({
          id: sku.id,
          skuCode: sku.skuCode,
          price: sku.price,
          stock: sku.stock,
          skuOptions: sku.skuOptions.map(
            (opt): SkuOptionResponse => ({
              attributeOptionId: opt.attributeOption.id,
              attributeOptionValue: opt.attributeOption.value,
              attribute: {
                id: opt.attributeOption.attribute.id,
                name: opt.attributeOption.attribute.name,
                description: opt.attributeOption.attribute.description,
              } as AttributeDetail, 
            }),
          ),
        }),
      ),
    };
  }

  static toResponses(products: Product[]): GetProductResponse[] {
    return products.map((product) => this.toResponse(product));
  }
}
