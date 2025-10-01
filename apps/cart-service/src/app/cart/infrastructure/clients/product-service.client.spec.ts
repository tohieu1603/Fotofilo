import { Test, TestingModule } from '@nestjs/testing';
import { Metadata } from '@grpc/grpc-js';
import { of } from 'rxjs';

import { ProductServiceClient } from './product-service.client';
import { Product } from '@nestcm/proto';
import { InsufficientStockError, SkuNotFoundError } from '../../domain/exceptions/cart-validation.exception';

const buildAvailability = (overrides: Partial<Product.CheckSkuAvailabilityResponse> = {}): Product.CheckSkuAvailabilityResponse => ({
  exists: true,
  inStock: true,
  availableStock: 5,
  message: 'SKU available',
  productId: 'product-1',
  skuCode: 'SKU-1',
  price: 199.99,
  productName: 'Test Product',
  description: 'Description',
  brandId: 'brand-1',
  image: 'http://example.com/image.jpg',
  categoryId: 'category-1',
  skuOptions: [],
  ...overrides,
});

describe('ProductServiceClient', () => {
  let client: ProductServiceClient;
  let productService: jest.Mocked<Product.ProductServiceClient>;

  beforeEach(async () => {
    productService = {
      existingSku: jest.fn(),
    } as unknown as jest.Mocked<Product.ProductServiceClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductServiceClient],
    }).compile();

    client = module.get(ProductServiceClient);
    (client as unknown as { productService: Product.ProductServiceClient }).productService = productService;
  });

  it('returns verified SKU data when availability is positive', async () => {
    productService.existingSku.mockReturnValue(of(buildAvailability()));

    const result = await client.verifySku({ skuId: 'sku-1', quantity: 2 });

    expect(productService.existingSku).toHaveBeenCalledWith(
      expect.objectContaining({ skuId: 'sku-1', quantity: 2 }),
      expect.any(Metadata),
    );
    expect(result.price).toBe(199.99);
    expect(result.itemDetail.name).toBe('Test Product');
  });

  it('throws SkuNotFoundError when product service reports missing SKU', async () => {
    productService.existingSku.mockReturnValue(
      of(buildAvailability({ exists: false, inStock: false })),
    );

    await expect(client.verifySku({ skuId: 'missing', quantity: 1 })).rejects.toBeInstanceOf(
      SkuNotFoundError,
    );
  });

  it('throws InsufficientStockError when stock is insufficient', async () => {
    productService.existingSku.mockReturnValue(
      of(buildAvailability({ inStock: false, availableStock: 1 })),
    );

    await expect(client.verifySku({ skuId: 'sku-1', quantity: 4 })).rejects.toBeInstanceOf(
      InsufficientStockError,
    );
  });

  it('throws when price is missing', async () => {
    productService.existingSku.mockReturnValue(
      of(buildAvailability({ price: undefined })),
    );

    await expect(client.verifySku({ skuId: 'sku-1', quantity: 1 })).rejects.toThrow(
      /Price is not available/,
    );
  });
});
