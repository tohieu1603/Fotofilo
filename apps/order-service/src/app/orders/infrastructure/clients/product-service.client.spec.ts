import { Test, TestingModule } from '@nestjs/testing';
import { ProductServiceClient } from './product-service.client';
import { ClientGrpc } from '@nestjs/microservices';
import { of } from 'rxjs';
import { Product as ProductProto } from '@nestcm/proto';

type ProductServiceMock = {
  validateSkuInputs: jest.MockedFunction<ProductProto.ProductServiceClient['validateSkuInputs']>;
  getProduct: jest.MockedFunction<ProductProto.ProductServiceClient['getProduct']>;
};

describe('ProductServiceClient', () => {
  let client: ProductServiceClient;
  let grpcClient: Partial<ClientGrpc>;
  let productService: ProductServiceMock;

  beforeEach(async () => {
    productService = {
      validateSkuInputs: jest.fn<
        ReturnType<ProductProto.ProductServiceClient['validateSkuInputs']>,
        Parameters<ProductProto.ProductServiceClient['validateSkuInputs']>
      >(),
      getProduct: jest.fn<
        ReturnType<ProductProto.ProductServiceClient['getProduct']>,
        Parameters<ProductProto.ProductServiceClient['getProduct']>
      >(),
    };

    grpcClient = {
      getService: jest.fn().mockReturnValue(productService),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductServiceClient,
        {
          provide: 'PRODUCT_PACKAGE',
          useValue: grpcClient,
        },
      ],
    }).compile();

    client = module.get<ProductServiceClient>(ProductServiceClient);
    client.onModuleInit();
  });

  describe('validateProduct', () => {
    it('should validate product successfully', async () => {
      const mockValidationResponse = {
        allValid: true,
        results: [
          {
            productId: 'product-1',
            name: 'Test Product',
            description: 'Test Description',
            brandId: 'brand-1',
            categoryId: 'category-1',
            skuId: 'sku-1',
            skuCode: 'TEST-SKU',
            price: 100.0,
            stock: 50,
            image: 'test-image.jpg',
            skuOptions: [],
            valid: true,
            inStock: true,
            availableStock: 50,
            message: 'Valid SKU',
          },
        ],
      };

      const mockProductResponse = {
        id: 'product-1',
        name: 'Test Product',
        description: 'Test Description',
        brandId: 'brand-1',
        categoryId: 'category-1',
        skus: [
          {
            id: 'sku-1',
            skuCode: 'TEST-SKU',
            price: 100.0,
            stock: 50,
            image: 'test-image.jpg',
            skuOptions: [],
          },
        ],
      };

      productService.validateSkuInputs.mockReturnValue(of(mockValidationResponse));
      productService.getProduct.mockReturnValue(of(mockProductResponse));

      const result = await client.validateProduct({
        productId: 'product-1',
        sku: 'TEST-SKU',
        quantity: 1,
        skuId: 'sku-1',
      });

      expect(result.isValid).toBe(true);
      expect(result.product).toBeDefined();
      expect(result.product?.id).toBe('product-1');
      expect(result.product?.name).toBe('Test Product');
      expect(result.product?.sku).toBe('TEST-SKU');
      expect(result.product?.price).toBe(100.0);
      expect(result.product?.stock).toBe(50);
    });

    it('should handle invalid SKU', async () => {
      const mockValidationResponse = {
        allValid: false,
        results: [
          {
            productId: 'product-1',
            name: '',
            description: '',
            brandId: '',
            categoryId: '',
            skuId: '',
            skuCode: 'INVALID-SKU',
            price: 0,
            stock: 0,
            image: '',
            skuOptions: [],
            valid: false,
            inStock: false,
            availableStock: 0,
            message: 'Invalid SKU',
          },
        ],
      };

      productService.validateSkuInputs.mockReturnValue(of(mockValidationResponse));

      const result = await client.validateProduct({
        productId: 'product-1',
        sku: 'INVALID-SKU',
        quantity: 1,
        skuId: 'sku-1',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SKU');
    });

    it('should handle insufficient stock', async () => {
      const mockValidationResponse = {
        allValid: true,
        results: [
          {
            productId: 'product-1',
            name: 'Test Product',
            description: 'Test Description',
            brandId: 'brand-1',
            categoryId: 'category-1',
            skuId: 'sku-1',
            skuCode: 'TEST-SKU',
            price: 100.0,
            stock: 50,
            image: 'test-image.jpg',
            skuOptions: [],
            valid: true,
            inStock: true,
            availableStock: 5,
            message: 'Valid SKU',
          },
        ],
      };

      const mockProductResponse = {
        id: 'product-1',
        name: 'Test Product',
        description: 'Test Description',
        brandId: 'brand-1',
        categoryId: 'category-1',
        skus: [
          {
            id: 'sku-1',
            skuCode: 'TEST-SKU',
            price: 100.0,
            stock: 5,
            image: 'test-image.jpg',
            skuOptions: [],
          },
        ],
      };

      productService.validateSkuInputs.mockReturnValue(of(mockValidationResponse));
      productService.getProduct.mockReturnValue(of(mockProductResponse));

      const result = await client.validateProduct({
        productId: 'product-1',
        sku: 'TEST-SKU',
        quantity: 10,
        skuId: 'sku-1',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });
  });
});