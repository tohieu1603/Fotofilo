import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CreateOrderCommand } from '../commands/create-order.command';
import { ProductServiceClient, ProductValidationRequest, ProductValidationResult } from '../../infrastructure/clients/product-service.client';
import { InventoryServiceClient } from '../../infrastructure/clients/inventory-service.client';
import { PaymentServiceClient } from '../../infrastructure/clients/payment-service.client';
import { TypeOrmOrderRepository } from '../../infrastructure/repositories/typeorm-order.repository';
import { CreateOrderData, OrderDto, OrderStatusValue, ShippingMethodValue } from '../dto/order.dto';
import { KafkaService } from '../../../common/kafka/kafka.service';

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  paymentUrl?: string;
  errors?: string[];
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    private readonly productServiceClient: ProductServiceClient,
    private readonly inventoryServiceClient: InventoryServiceClient,
    private readonly paymentServiceClient: PaymentServiceClient,
    private readonly orderRepository: TypeOrmOrderRepository,
    private readonly kafkaService: KafkaService,
  ) {}

  async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    try {

      const inputValidationErrors = this.validateInput(command);
      if (inputValidationErrors.length > 0) {
        this.logger.warn('Validation errors:', inputValidationErrors);
        return {
          success: false,
          errors: inputValidationErrors,
        };
      }

      const productValidationRequests: ProductValidationRequest[] = command.items.map((item) => ({
        productId: item.productId,
        sku: item.productSku,
        skuId: item.skuId, 
        quantity: item.quantity,
      }));

      this.logger.log('Validating products with product service');
      const validationResults = await this.productServiceClient.validateProducts(productValidationRequests);

      const validationErrors = this.collectValidationErrors(validationResults);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        };
      }

      this.logger.log('Checking inventory stock');
      const skuCodes = command.items.map(item => item.productSku);
      const inventoryCheckResult = await this.inventoryServiceClient.checkInventory({ skuCodes });

      const inventoryErrors = this.collectInventoryErrors(command.items, inventoryCheckResult.items);
      if (inventoryErrors.length > 0) {
        return {
          success: false,
          errors: inventoryErrors,
        };
      }

      const orderCalculation = this.calculateOrderTotals(command, validationResults);
      const status: OrderStatusValue = 'PENDING';
      const shippingMethod: ShippingMethodValue = command.shippingMethod ?? 'STANDARD';
      const orderData: CreateOrderData = {
        customerId: command.customerId,
        orderNumber: this.generateOrderNumber(),
        status,
        subtotal: orderCalculation.subtotal,
        taxAmount: orderCalculation.taxAmount,
        shippingAmount: orderCalculation.shippingAmount,
        discountAmount: 0,
        totalAmount: orderCalculation.totalAmount,
        currency: command.currency ?? 'USD',
        shippingMethod,
        notes: command.notes,
        shippingAddressId: command.shippingAddressId,
        billingAddressId: command.billingAddressId,
        items: validationResults.map((result, index) => ({
          productId: result.product?.id ?? '',
          productName: result.product?.name ?? '',
          productSku: result.product?.sku ?? command.items[index].productSku,
          quantity: command.items[index].quantity,
          unitPrice: result.product?.price ?? 0,
          discountAmount: 0,
          totalAmount: (result.product?.price ?? 0) * command.items[index].quantity,
          productAttributes: result.product ? { stock: result.product.stock } : undefined,
        })),
        shippingAddress: { ...command.shippingAddress },
        billingAddress: command.billingAddress ? { ...command.billingAddress } : { ...command.shippingAddress },
      };

      this.logger.log('Saving order to database');
      const savedOrder: OrderDto = await this.orderRepository.save(orderData);

      this.logger.log(`Order created successfully: ${savedOrder.id}`);

      // Create payment synchronously
      let paymentUrl: string | undefined = undefined;
      try {
        const paymentMethod = command.paymentMethod || 'COD';
        this.logger.log(`Creating payment with method: ${paymentMethod}`);

        const paymentResponse = await this.paymentServiceClient.createPayment(
          savedOrder.id,
          savedOrder.customerId,
          savedOrder.totalAmount,
          savedOrder.currency,
          paymentMethod,
          `Payment for order ${savedOrder.orderNumber}`,
        );

        paymentUrl = paymentResponse.paymentUrl;

        // Update order with payment URL if exists
        if (paymentUrl) {
          await this.orderRepository.updatePaymentUrl(savedOrder.id, paymentUrl);
          this.logger.log(`Payment URL saved for order ${savedOrder.id}: ${paymentUrl}`);
        }

        this.logger.log(`Payment created successfully for order ${savedOrder.id}`);
      } catch (paymentError) {
        this.logger.error('Failed to create payment:', paymentError);
        // Don't fail the order creation if payment creation fails
        // The order can be processed later
      }

      try {
        const orderCreatedEvent = {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          customerId: savedOrder.customerId,
          addressId: savedOrder.shippingAddressId,
          totalAmount: savedOrder.totalAmount,
          currency: savedOrder.currency,
          status: savedOrder.status,
          paymentMethod: command.paymentMethod || 'COD',
          customerEmail: null,
          items: savedOrder.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
          })),
          shippingAddress: savedOrder.shippingAddress,
          createdAt: savedOrder.createdAt,
        };

        this.kafkaService.emit('order.created', orderCreatedEvent);
        this.logger.log('Order created event sent to Kafka');
      } catch (kafkaError) {
        this.logger.error('Failed to send Kafka message:', kafkaError);
      }

      return {
        success: true,
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        paymentUrl,
      };
    } catch (error) {
      this.logger.error('Error creating order:', error);
      return {
        success: false,
        errors: [`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private validateInput(command: CreateOrderCommand): string[] {
    const errors: string[] = [];

    if (!command.customerId) {
      errors.push('Customer ID is required');
    }

    if (!command.items || command.items.length === 0) {
      errors.push('At least one order item is required');
    }

    command.items?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Product ID is required for item ${index + 1}`);
      }
      if (!item.productSku) {
        errors.push(`Product SKU is required for item ${index + 1}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Valid quantity is required for item ${index + 1}`);
      }
    });

    if (!command.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      const { fullName, addressLine1, city, country } = command.shippingAddress;
      if (!fullName) {
        errors.push('Shipping address full name is required');
      }
      if (!addressLine1) {
        errors.push('Shipping address line 1 is required');
      }
      if (!city) {
        errors.push('Shipping address city is required');
      }
      if (!country) {
        errors.push('Shipping address country is required');
      }
    }

    return errors;
  }

  private collectValidationErrors(results: ProductValidationResult[]): string[] {
    return results.reduce<string[]>((acc, result, index) => {
      if (!result.isValid) {
        acc.push(`Item ${index + 1}: ${result.error ?? 'Invalid product'}`);
      }
      return acc;
    }, []);
  }

  private calculateOrderTotals(
    command: CreateOrderCommand,
    validationResults: ProductValidationResult[],
  ): {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    totalAmount: number;
  } {
    const subtotal = validationResults.reduce((sum, result, index) => {
      const price = result.product?.price ?? 0;
      const quantity = command.items[index].quantity;
      return sum + price * quantity;
    }, 0);

    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;

    const shippingAmount = this.resolveShippingAmount(command.shippingMethod ?? 'STANDARD');
    const totalAmount = subtotal + taxAmount + shippingAmount;

    return {
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
    };
  }

  private resolveShippingAmount(method: ShippingMethodValue): number {
    switch (method) {
      case 'EXPRESS':
        return 15;
      case 'OVERNIGHT':
        return 25;
      default:
        return 5;
    }
  }

  private collectInventoryErrors(items: any[], stockItems: any[]): string[] {
    const errors: string[] = [];
    const stockMap = new Map();

    stockItems.forEach(stockItem => {
      stockMap.set(stockItem.skuCode, stockItem.stock);
    });

    items.forEach((item, index) => {
      const availableStock = stockMap.get(item.productSku);

      if (availableStock === undefined) {
        errors.push(`Item ${index + 1}: Stock information not found for SKU ${item.productSku}`);
      } else if (availableStock < item.quantity) {
        errors.push(`Item ${index + 1}: Insufficient stock for SKU ${item.productSku}. Available: ${availableStock}, Requested: ${item.quantity}`);
      }
    });

    return errors;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }
}