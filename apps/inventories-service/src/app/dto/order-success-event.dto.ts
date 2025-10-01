export interface OrderSuccessEventDto {
  orderId: string;
  orderNumber: string;
  customerId: string;
  items: Array<{
    skuId: string;
    skuCode: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: Date;
}