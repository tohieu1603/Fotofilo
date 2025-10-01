/**
 * Product Information Value Object
 * Contains product details for order items
 */
export interface ProductInfo {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  image?: string;
  sku?: string;
}

/**
 * Product Detail Value Object
 * Encapsulates product information with validation
 */
export class ProductDetail {
  constructor(private readonly productInfo: ProductInfo) {
    this.validate();
  }

  private validate(): void {
    if (!this.productInfo.name || this.productInfo.name.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }

    if (this.productInfo.name.length > 255) {
      throw new Error('Product name cannot exceed 255 characters');
    }

    if (this.productInfo.description && this.productInfo.description.length > 1000) {
      throw new Error('Product description cannot exceed 1000 characters');
    }
  }

  getName(): string {
    return this.productInfo.name;
  }

  getDescription(): string | undefined {
    return this.productInfo.description;
  }

  getCategory(): string | undefined {
    return this.productInfo.category;
  }

  getBrand(): string | undefined {
    return this.productInfo.brand;
  }

  getImage(): string | undefined {
    return this.productInfo.image;
  }

  getSku(): string | undefined {
    return this.productInfo.sku;
  }

  getProductInfo(): ProductInfo {
    return { ...this.productInfo };
  }

  equals(other: ProductDetail): boolean {
    return JSON.stringify(this.productInfo) === JSON.stringify(other.productInfo);
  }

  toString(): string {
    return this.productInfo.name;
  }
}