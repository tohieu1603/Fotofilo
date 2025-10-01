import { Test, TestingModule } from '@nestjs/testing';
import { AddToCartHandler } from './add-cart.handler';
import { AddToCartCommand } from '../commands/add-cart.command';
import { ICartRepository } from '../../domain/repositories/cart.repository';
import { IProductServiceClient, VerifiedSku } from '../../infrastructure/clients/product-service.client';
import { Cart } from '../../domain';
import { CartValidationError } from '../../domain/exceptions/cart-validation.exception';
import { ItemDetail } from '../../domain/entities/cart-item-entity';

describe('AddToCartHandler', () => {
  let handler: AddToCartHandler;
  let cartRepository: jest.Mocked<ICartRepository>;
  let productServiceClient: jest.Mocked<IProductServiceClient>;

  const baseItemDetail: ItemDetail = {
    name: 'Test Product',
    description: 'Description',
    brand: 'Brand',
    category: 'Category',
    attributes: { Color: 'Black' },
    variants: { Size: 'Standard' },
  };

  const verifiedSku: VerifiedSku = {
    productId: 'product-1',
    skuId: 'sku-1',
    skuCode: 'SKU-1',
    price: 199.99,
    availableStock: 5,
    itemDetail: baseItemDetail,
  };

  beforeEach(async () => {
    cartRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ICartRepository>;

    productServiceClient = {
      verifySku: jest.fn(),
    } as unknown as jest.Mocked<IProductServiceClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddToCartHandler,
        { provide: 'ICartRepository', useValue: cartRepository },
        { provide: 'IProductServiceClient', useValue: productServiceClient },
      ],
    }).compile();

    handler = module.get(AddToCartHandler);
  });

  it('adds item to new cart when SKU verification succeeds', async () => {
    productServiceClient.verifySku.mockResolvedValue(verifiedSku);
    cartRepository.findByUserId.mockResolvedValue(null);
    cartRepository.save.mockImplementation(async (cart) => cart);

    const command = new AddToCartCommand('user-1', 'sku-1', 2);
    const response = await handler.execute(command);

    expect(productServiceClient.verifySku).toHaveBeenCalledWith({
      skuId: 'sku-1',
      quantity: 2,
    });
    expect(cartRepository.save).toHaveBeenCalled();
    expect(response.cart.userId).toBe('user-1');
    expect(response.cart.items[0].quantity).toBe(2);
  });

  it('merges custom item detail overrides', async () => {
    productServiceClient.verifySku.mockResolvedValue(verifiedSku);
    cartRepository.findByUserId.mockResolvedValue(null);
    cartRepository.save.mockImplementation(async (cart) => cart);

    const overrides: ItemDetail = {
      name: 'Override Name',
      description: 'Override',
      brand: 'Brand',
      category: 'Category',
      attributes: { Color: 'Silver' },
      variants: { Bundle: 'Kit' },
    };

    const command = new AddToCartCommand('user-1', 'sku-1', 1, undefined, overrides);
    const result = await handler.execute(command);

    const detail = result.cart.items[0].itemDetail;
    expect(detail.name).toBe('Override Name');
    expect(detail.attributes?.Color).toBe('Silver');
    expect(detail.variants?.Bundle).toBe('Kit');
  });

  it('throws validation error for invalid quantity', async () => {
    const command = new AddToCartCommand('user-1', 'sku-1', 0);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(CartValidationError);
    expect(productServiceClient.verifySku).not.toHaveBeenCalled();
  });

  it('rethrows domain validation errors from product service', async () => {
    const domainError = new CartValidationError('Test error');
    productServiceClient.verifySku.mockRejectedValue(domainError);

    const command = new AddToCartCommand('user-1', 'sku-1', 1);

    await expect(handler.execute(command)).rejects.toBe(domainError);
  });
});
