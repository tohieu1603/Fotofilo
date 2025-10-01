import { CreateOrderHandler } from './create-order.handler';
import { ProductServiceClient } from '../../infrastructure/clients/product-service.client';
import { InventoryServiceClient } from '../../infrastructure/clients/inventory-service.client';
import { TypeOrmOrderRepository } from '../../infrastructure/repositories/typeorm-order.repository';
import { KafkaService } from '../../../common/kafka/kafka.service';
import { CreateOrderCommand } from '../commands/create-order.command';

describe('CreateOrderHandler - Inventory Integration', () => {
  let handler: CreateOrderHandler;
  let productServiceClient: jest.Mocked<ProductServiceClient>;
  let inventoryServiceClient: jest.Mocked<InventoryServiceClient>;
  let orderRepository: jest.Mocked<TypeOrmOrderRepository>;
  let kafkaService: jest.Mocked<KafkaService>;

  beforeEach(() => {
    productServiceClient = {
      validateProducts: jest.fn(),
      validateProduct: jest.fn(),
      onModuleInit: jest.fn(),
    } as any;

    inventoryServiceClient = {
      checkInventory: jest.fn(),
      onModuleInit: jest.fn(),
    } as any;

    orderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findByCustomerId: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    kafkaService = {
      emit: jest.fn(),
    } as any;

    handler = new CreateOrderHandler(
      productServiceClient,
      inventoryServiceClient,
      orderRepository,
      kafkaService,
    );
  });

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

  describe('inventory checking', () => {
    it('should successfully create order when inventory is sufficient', async () => {
      // Mock product validation
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

      // Mock inventory check with sufficient stock
      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [
          { skuCode: 'SKU-001', stock: 50 },
          { skuCode: 'SKU-002', stock: 25 },
        ],
      });

      // Mock order repository save
      const mockSavedOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        customerId: 'customer-123',
        status: 'PENDING' as const,
        subtotal: 400,
        taxAmount: 40,
        shippingAmount: 5,
        discountAmount: 0,
        totalAmount: 445,
        currency: 'VND',
        shippingMethod: 'STANDARD' as const,
        items: [],
        shippingAddress: {} as any,
        billingAddress: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      orderRepository.save.mockResolvedValue(mockSavedOrder);

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-123');
      expect(result.orderNumber).toBe('ORD-001');
      expect(inventoryServiceClient.checkInventory).toHaveBeenCalledWith({
        skuCodes: ['SKU-001', 'SKU-002'],
      });
    });

    it('should fail when inventory is insufficient', async () => {
      // Mock product validation
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

      // Mock inventory check with insufficient stock
      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [
          { skuCode: 'SKU-001', stock: 1 }, // Insufficient: requested 2, available 1
        ],
      });

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Insufficient stock for SKU SKU-001');
      expect(result.errors?.[0]).toContain('Available: 1, Requested: 2');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when stock information is not found', async () => {
      // Mock product validation
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

      // Mock inventory check with no stock information
      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [], // No stock items returned
      });

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Stock information not found for SKU SKU-001');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should handle inventory service errors gracefully', async () => {
      // Mock product validation
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

      // Mock inventory service error
      inventoryServiceClient.checkInventory.mockRejectedValue(
        new Error('Inventory service unavailable')
      );

      const result = await handler.execute(validCommand);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Inventory service unavailable');
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should check inventory with correct SKU codes', async () => {
      // Mock product validation
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

      // Mock inventory check
      inventoryServiceClient.checkInventory.mockResolvedValue({
        items: [
          { skuCode: 'SKU-001', stock: 50 },
          { skuCode: 'SKU-002', stock: 25 },
        ],
      });

      // Mock order repository save
      orderRepository.save.mockResolvedValue({
        id: 'order-123',
        orderNumber: 'ORD-001',
      } as any);

      await handler.execute(validCommand);

      // Verify that inventory was checked with the correct SKU codes
      expect(inventoryServiceClient.checkInventory).toHaveBeenCalledWith({
        skuCodes: ['SKU-001', 'SKU-002'],
      });
      expect(inventoryServiceClient.checkInventory).toHaveBeenCalledTimes(1);
    });
  });
});