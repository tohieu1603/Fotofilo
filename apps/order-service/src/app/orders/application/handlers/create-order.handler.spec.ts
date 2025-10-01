import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrderHandler } from './create-order.handler';
import {
  ProductServiceClient,
  ProductValidationRequest,
  ProductValidationResult,
} from '../../infrastructure/clients/product-service.client';
import { InventoryServiceClient } from '../../infrastructure/clients/inventory-service.client';
import { TypeOrmOrderRepository } from '../../infrastructure/repositories/typeorm-order.repository';
import { CreateOrderCommand } from '../commands/create-order.command';
import { CreateOrderData, OrderDto } from '../dto/order.dto';
import { KafkaService } from '../../../common/kafka/kafka.service';
import { Inventory } from '@nestcm/proto';

type ProductServiceClientMock = {
  validateProduct: jest.Mock<Promise<ProductValidationResult>, [ProductValidationRequest]>;
  validateProducts: jest.Mock<Promise<ProductValidationResult[]>, [ProductValidationRequest[]]>;
  onModuleInit: jest.Mock<void, []>;
};

type InventoryServiceClientMock = {
  checkInventory: jest.Mock<Promise<Inventory.CheckStockResponse>, [Inventory.CheckStockRequest]>;
  onModuleInit: jest.Mock<void, []>;
};

type OrderRepositoryMock = {
  save: jest.Mock<Promise<OrderDto>, [CreateOrderData | OrderDto]>;
  findById: jest.Mock<Promise<OrderDto | null>, [string]>;
  findByOrderNumber: jest.Mock<Promise<OrderDto | null>, [string]>;
  findByCustomerId: jest.Mock<
    Promise<OrderDto[]>,
    [string, number | undefined, number | undefined]
  >;
  delete: jest.Mock<Promise<void>, [string]>;
  exists: jest.Mock<Promise<boolean>, [string]>;
};

type KafkaServiceMock = {
  emit: jest.Mock<void, [string, any]>;
};

const createProductServiceClientMock = (): ProductServiceClientMock => ({
  validateProduct: jest.fn<Promise<ProductValidationResult>, [ProductValidationRequest]>(),
  validateProducts: jest.fn<Promise<ProductValidationResult[]>, [ProductValidationRequest[]]>(),
  onModuleInit: jest.fn(),
});

const createInventoryServiceClientMock = (): InventoryServiceClientMock => ({
  checkInventory: jest.fn<Promise<Inventory.CheckStockResponse>, [Inventory.CheckStockRequest]>(),
  onModuleInit: jest.fn(),
});

const createOrderRepositoryMock = (): OrderRepositoryMock => ({
  save: jest.fn<Promise<OrderDto>, [CreateOrderData | OrderDto]>(),
  findById: jest.fn<Promise<OrderDto | null>, [string]>(),
  findByOrderNumber: jest.fn<Promise<OrderDto | null>, [string]>(),
  findByCustomerId: jest.fn<
    Promise<OrderDto[]>,
    [string, number | undefined, number | undefined]
  >(),
  delete: jest.fn<Promise<void>, [string]>(),
  exists: jest.fn<Promise<boolean>, [string]>(),
});

const createKafkaServiceMock = (): KafkaServiceMock => ({
  emit: jest.fn<void, [string, any]>(),
});

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;
  let productServiceClient: ProductServiceClientMock;
  let inventoryServiceClient: InventoryServiceClientMock;
  let orderRepository: OrderRepositoryMock;
  let kafkaService: KafkaServiceMock;

  beforeEach(async () => {
    productServiceClient = createProductServiceClientMock();
    inventoryServiceClient = createInventoryServiceClientMock();
    orderRepository = createOrderRepositoryMock();
    kafkaService = createKafkaServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderHandler,
        {
          provide: ProductServiceClient,
          useValue: productServiceClient,
        },
        {
          provide: InventoryServiceClient,
          useValue: inventoryServiceClient,
        },
        {
          provide: TypeOrmOrderRepository,
          useValue: orderRepository,
        },
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
      ],
    }).compile();

    handler = module.get(CreateOrderHandler);
  });

  describe('execute', () => {
    const validCommand = new CreateOrderCommand(
      'customer-123',
      [
        {
          productId: 'product-1',
          productSku: 'SKU-001',
          quantity: 2,
          requestedPrice: 100.0,
        },
        {
          productId: 'product-2',
          productSku: 'SKU-002',
          quantity: 1,
          requestedPrice: 200.0,
        },
      ],
      {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Ho Chi Minh',
        country: 'Vietnam',
        phoneNumber: '0123456789',
      },
      {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Ho Chi Minh',
        country: 'Vietnam',
        phoneNumber: '0123456789',
      },
      'STANDARD',
      'Test order notes',
      'VND',
    );

    it('should create order successfully with valid products and sufficient inventory', async () => {
      productServiceClient.validateProducts.mockResolvedValue([
        {
          isValid: true,
          product: {
            id: 'product-1',
            name: 'Test Product 1',
            sku: 'SKU-001',
            price: 100.0,
            isAvailable: true,
            stock: 50,
          },
        },
        {
          isValid: true,
          product: {
            id: 'product-2',
            name: 'Test Product 2',
            sku: 'SKU-002',
            price: 200.0,
            isAvailable: true,
            stock: 25,
          },
        },
      ]);

      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [
          { skuCode: 'SKU-001', stock: 50 },
          { skuCode: 'SKU-002', stock: 25 },
        ],
      });

      const now = new Date();
      const mockSavedOrder: OrderDto = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        customerId: 'customer-123',
        status: 'PENDING',
        subtotal: 400,
        taxAmount: 40,
        shippingAmount: 5,
        discountAmount: 0,
        totalAmount: 445,
        currency: 'VND',
        shippingMethod: 'STANDARD',
        items: [
          {
            id: 'detail-1',
            productId: 'product-1',
            productName: 'Test Product 1',
            productSku: 'SKU-001',
            quantity: 2,
            unitPrice: 100,
            discountAmount: 0,
            totalAmount: 200,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'detail-2',
            productId: 'product-2',
            productName: 'Test Product 2',
            productSku: 'SKU-002',
            quantity: 1,
            unitPrice: 200,
            discountAmount: 0,
            totalAmount: 200,
            createdAt: now,
            updatedAt: now,
          },
        ],
        shippingAddress: {
          id: 'ship-1',
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'Ho Chi Minh',
          country: 'Vietnam',
          phoneNumber: '0123456789',
          createdAt: now,
          updatedAt: now,
        },
        billingAddress: {
          id: 'bill-1',
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'Ho Chi Minh',
          country: 'Vietnam',
          phoneNumber: '0123456789',
          createdAt: now,
          updatedAt: now,
        },
        trackingNumber: undefined,
        notes: 'Test order notes',
        paymentId: undefined,
        createdAt: now,
        updatedAt: now,
      };
      orderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await handler.execute(validCommand);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-123');
      expect(result.orderNumber).toBe('ORD-001');
      expect(productServiceClient.validateProducts).toHaveBeenCalledWith([
        {
          productId: 'product-1',
          sku: 'SKU-001',
          skuId: undefined,
          quantity: 2,
        },
        {
          productId: 'product-2',
          sku: 'SKU-002',
          skuId: undefined,
          quantity: 1,
        },
      ]);
      expect(inventoryServiceClient.checkInventory).toHaveBeenCalledWith({
        skuCodes: ['SKU-001', 'SKU-002'],
      });
      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should return failure result when product validation fails', async () => {
      productServiceClient.validateProducts.mockResolvedValue([
        {
          isValid: false,
          error: 'Product not found',
        },
        {
          isValid: true,
          product: {
            id: 'product-2',
            name: 'Test Product 2',
            sku: 'SKU-002',
            price: 200.0,
            isAvailable: true,
            stock: 25,
          },
        },
      ]);

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors[0]).toContain('Product not found');
      expect(productServiceClient.validateProducts).toHaveBeenCalled();
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should return failure result when multiple products are invalid', async () => {
      productServiceClient.validateProducts.mockResolvedValue([
        {
          isValid: false,
          error: 'Product not found',
        },
        {
          isValid: false,
          error: 'Insufficient stock',
        },
      ]);

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors[0]).toContain('Product not found');
      expect(result.errors && result.errors[1]).toContain('Insufficient stock');
    });

    it('should validate required fields and return failure', async () => {
      const invalidCommand = new CreateOrderCommand(
        '',
        [],
        {
          fullName: '',
          addressLine1: '',
          city: '',
          country: '',
        },
      );

      const result = await handler.execute(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should return failure result when inventory is insufficient', async () => {
      productServiceClient.validateProducts.mockResolvedValue([
        {
          isValid: true,
          product: {
            id: 'product-1',
            name: 'Test Product 1',
            sku: 'SKU-001',
            price: 100.0,
            isAvailable: true,
            stock: 50,
          },
        },
        {
          isValid: true,
          product: {
            id: 'product-2',
            name: 'Test Product 2',
            sku: 'SKU-002',
            price: 200.0,
            isAvailable: true,
            stock: 25,
          },
        },
      ]);

      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [
          { skuCode: 'SKU-001', stock: 1 }, // Insufficient: requested 2, available 1
          { skuCode: 'SKU-002', stock: 25 },
        ],
      });

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors[0]).toContain('Insufficient stock for SKU SKU-001');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should return failure result when inventory check fails for missing SKU', async () => {
      productServiceClient.validateProducts.mockResolvedValue([
        {
          isValid: true,
          product: {
            id: 'product-1',
            name: 'Test Product 1',
            sku: 'SKU-001',
            price: 100.0,
            isAvailable: true,
            stock: 50,
          },
        },
      ]);

      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [], // No stock information returned
      });

      const invalidCommand = new CreateOrderCommand(
        'customer-123',
        [
          {
            productId: 'product-1',
            productSku: 'SKU-001',
            quantity: 2,
            requestedPrice: 100.0,
          },
        ],
        {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'Ho Chi Minh',
          country: 'Vietnam',
          phoneNumber: '0123456789',
        },
      );

      const result = await handler.execute(invalidCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors[0]).toContain('Stock information not found for SKU SKU-001');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should handle product service client errors gracefully', async () => {
      productServiceClient.validateProducts.mockRejectedValue(new Error('gRPC connection failed'));

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors[0]).toContain('gRPC connection failed');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should handle inventory service client errors gracefully', async () => {
      productServiceClient.validateProducts.mockResolvedValue([
        {
          isValid: true,
          product: {
            id: 'product-1',
            name: 'Test Product 1',
            sku: 'SKU-001',
            price: 100.0,
            isAvailable: true,
            stock: 50,
          },
        },
      ]);

      inventoryServiceClient.checkInventory.mockRejectedValue(new Error('Inventory service unavailable'));

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors && result.errors[0]).toContain('Inventory service unavailable');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });
});