export class CartValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidSkus: string[] = []
  ) {
    super(message);
    this.name = 'CartValidationError';
  }
}

export class SkuNotFoundError extends CartValidationError {
  constructor(skuId: string) {
    super(`SKU not found: ${skuId}`, [skuId]);
    this.name = 'SkuNotFoundError';
  }
}

export class InsufficientStockError extends CartValidationError {
  constructor(skuId: string, requested: number, available: number) {
    super(`Insufficient stock for SKU ${skuId}. Requested: ${requested}, Available: ${available}`, [skuId]);
    this.name = 'InsufficientStockError';
  }
}