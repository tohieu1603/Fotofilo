import { Product } from "../entities/product.entity";
import { Sku } from "../entities/sku.entity";
import { Product as ProductProto } from "@nestcm/proto";
export class SkuMapper {
  static toAvailabilityResponse(
    sku: Sku,
    product: Product,
    requestedQuantity: number,
  ): ProductProto.CheckSkuAvailabilityResponse {
    const availableStock = sku.stock ?? 0;
    const inStock = availableStock >= requestedQuantity;

    return {
      exists: true,
      inStock,
      availableStock,
      message: inStock
        ? 'SKU available'
        : `Insufficient stock. Available: ${availableStock}, requested: ${requestedQuantity}`,
      productId: product.id,
      skuCode: sku.skuCode,
      price: Number(sku.price),
      productName: product.name,
      description: product.description ?? '',
      image: sku.image ?? '',
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
      } : undefined,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : undefined,
      skuOptions:
        sku.skuOptions?.map((option) => ({
          attributeOptionId: option.attributeOption?.id ?? '',
          attributeOptionValue: option.attributeOption?.value ?? '',
          attribute: option.attributeOption?.attribute
            ? {
                id: option.attributeOption.attribute.id,
                name: option.attributeOption.attribute.name,
                description: option.attributeOption.attribute.description ?? '',
              }
            : undefined,
        })) ?? [],
    };
  }
}
