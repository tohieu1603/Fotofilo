import { Product } from '../entities/product.entity';
import { Product as ProductProto } from '@nestcm/proto';

export class ProductMapper {
  static toGetProductResponse(product: Product): ProductProto.GetProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      originalPrice: product.originalPrice ?? 0,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : undefined,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : undefined,
      skus: product.skus?.map(
        (sku): ProductProto.SkuResponse => ({
          id: sku.id,
          skuCode: sku.skuCode,
          price: sku.price,
          image: sku.image,
          stock: sku.stock,
          originalPrice: 0,
          skuOptions: sku.skuOptions?.map(
            (opt): ProductProto.SkuOptionResponse => ({
              attributeOptionId: opt.attributeOption.id,
              attributeOptionValue: opt.attributeOption.value,
              attribute: {
                id: opt.attributeOption.attribute.id,
                name: opt.attributeOption.attribute.name,
                description: opt.attributeOption.attribute.description,
              },
            }),
          ) ?? [],
        }),
      ) ?? [],
    };
  }

  static toCreateResponse(product: Product): ProductProto.CreateProductResponse {
    return {
      product: this.toGetProductResponse(product),
    };
  }

  static toUpdateResponse(product: Product): ProductProto.UpdateProductResponse {
    return {
      product: this.toGetProductResponse(product),
    };
  }

  static toListResponse(products: Product[]): ProductProto.GetProductResponse[] {
    return products.map((p) => this.toGetProductResponse(p));
  }
}
