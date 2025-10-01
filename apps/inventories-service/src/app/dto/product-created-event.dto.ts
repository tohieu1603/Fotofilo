export interface ProductCreatedEventDto {
  productId: string;
  name: string;
  skus: Array<{
    id: string;
    skuCode: string;
    initialStock?: number;
    importSource?: string;
    importBatch?: string;
    supplierName?: string;
    importPrice?: number;
  }>;
  createdAt: Date;
}