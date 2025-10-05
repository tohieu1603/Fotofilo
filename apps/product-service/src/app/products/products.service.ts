

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, ILike, QueryFailedError } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { Product } from './entities/product.entity';
import { Sku } from './entities/sku.entity';
import { Brand } from './entities/brand.entity';
import { CategoryEntity } from '../categories/infrastructure/entities/category.entity';
import { AttributeOption } from './entities/attribute-option.entity';
import { SkuAttributeOption } from './entities/sku-attribute-option.entity';

import { ProductMapper } from './mappers/product.mapper';
import { Product as ProductProto } from '@nestcm/proto';
import { SkuMapper } from './mappers/sku.mapper';
import { KafkaService } from '../shared/kafka/kafka.service';
import { Attribute } from './entities/attribute.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Sku) private skuRepo: Repository<Sku>,
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(CategoryEntity) private categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(Attribute) private attributeRepo: Repository<Attribute>,
    @InjectRepository(AttributeOption) private attributeOptionRepo: Repository<AttributeOption>,
    @InjectRepository(SkuAttributeOption) private skuAttrOptionRepo: Repository<SkuAttributeOption>,
    private readonly dataSource: DataSource,
    private readonly kafkaService: KafkaService,
    // private readonly redis: RedisService,
  ) { }


  async createProductWithSkus(data: ProductProto.CreateProductRequest): Promise<ProductProto.CreateProductResponse> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Validate brand and category
      const [brand, category] = await Promise.all([
        queryRunner.manager.findOneBy(Brand, { id: data.brandId }),
        queryRunner.manager.findOneBy(CategoryEntity, { id: data.categoryId }),
      ]);

      if (!brand) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          details: `Brand not found with ID: ${data.brandId}`,
        });
      }
      if (!category) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          details: `Category not found with ID: ${data.categoryId}`,
        });
      }

      const allAttrOptionIds = data.skus.flatMap((sku) =>
        sku.attributes.map((a) => a.attributeOptionId),
      );

      const attrOptions = await queryRunner.manager.findBy(AttributeOption, {
        id: In(allAttrOptionIds),
      });

      const foundIds = new Set(attrOptions.map((o) => o.id));
      const missingIds = allAttrOptionIds.filter((id) => !foundIds.has(id));

      if (missingIds.length) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          details: `Missing attribute options: ${missingIds.join(', ')}`,
        });
      }

      const skuCodes = data.skus.map(sku => sku.skuCode);
      const existingSkus = await queryRunner.manager.findBy(Sku, {
        skuCode: In(skuCodes),
      });

      if (existingSkus.length > 0) {
        const duplicateCodes = existingSkus.map(sku => sku.skuCode);
        this.logger.error(`❌ Duplicate SKU codes found: ${duplicateCodes.join(', ')}`);
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          details: `SKU codes already exist: ${duplicateCodes.join(', ')}. Please use unique SKU codes.`,
        });
      }

      this.logger.log('💾 Creating product...');
      const product = queryRunner.manager.create(Product, {
        name: data.name,
        description: data.description,
        brandId: data.brandId,
        categoryId: data.categoryId,
        originalPrice: data.originalPrice,
      });

      const savedProduct = await queryRunner.manager.save(product);

      for (let i = 0; i < data.skus.length; i++) {
        const skuData = data.skus[i];

        const sku = queryRunner.manager.create(Sku, {
          productId: savedProduct.id,
          skuCode: skuData.skuCode,
          price: skuData.price,
          stock: skuData.stock,
          image: skuData.image,
        });

        const savedSku = await queryRunner.manager.save(sku);

        const skuOptions = skuData.attributes.map((a) =>
          queryRunner.manager.create(SkuAttributeOption, {
            skuId: savedSku.id,
            attributeOptionId: a.attributeOptionId,
          }),
        );

        await queryRunner.manager.save(skuOptions);
        this.logger.log(`Create Sku success`);
      }

      await queryRunner.commitTransaction();
      this.logger.log('Product creation completed successfully');

      try {
        this.logger.log('Sending product.created Kafka event...');

        const createdSkus = await this.skuRepo.find({
          where: { productId: savedProduct.id }
        });

        const kafkaEventData = {
          productId: savedProduct.id,
          name: savedProduct.name,
          skus: createdSkus.map(sku => ({
            id: sku.id,
            skuCode: sku.skuCode,
            initialStock: sku.stock,
            importSource: 'Initial Product Creation',
            importBatch: `BATCH-${savedProduct.id.substring(0, 8)}`,
            supplierName: 'Internal',
            importPrice: sku.price,
          })),
          createdAt: savedProduct.createdAt,
        };

        await this.kafkaService.emit('product.created', kafkaEventData);
        
        this.logger.log('Product.created Kafka event sent successfully');
      } catch (kafkaError) {
        this.logger.error(`Failed to send Kafka event: ${kafkaError.message}`, kafkaError.stack);
      }

      return ProductMapper.toCreateResponse(savedProduct);

    } catch (error) {
      this.logger.error('Transaction failed, rolling back...');

      try {
        await queryRunner.rollbackTransaction();
        this.logger.log('Transaction rolled back successfully');
      } catch (rollbackError) {
        this.logger.error('Error during rollback:');
      }

      if (error instanceof QueryFailedError) {
        const pgError = error.driverError;

        if (pgError?.code === '23505' && pgError?.constraint === 'UQ_0c00ed613cd7936beeee19fe614') {
          const duplicateSkuCode = pgError?.detail?.match(/Key \("skuCode"\)=\(([^)]+)\)/)?.[1];
          throw new RpcException({
            code: GrpcStatus.INVALID_ARGUMENT,
            details: `SKU code already exists: ${duplicateSkuCode}. Please use a unique SKU code.`,
          });
        }

        if (pgError?.code === '23505') {
          throw new RpcException({
            code: GrpcStatus.INVALID_ARGUMENT,
            details: `Duplicate value violates unique constraint: ${pgError?.detail || 'Unknown field'}`,
          });
        }
      }

      throw error;
    } finally {
      try {
        await queryRunner.release();
        this.logger.log('Query runner released');
      } catch (releaseError) {
        this.logger.error('Error releasing query runner:');
      }
    }
  }

  async getProduct(id: string, userId?: string): Promise<ProductProto.GetProductResponse> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['brand', 'category', 'skus.skuOptions.attributeOption.attribute'],
    });

    if (!product) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        details: 'Product not found',
      });
    }

    // Send Kafka event if userId is provided
    if (userId) {
      try {
        await this.kafkaService.emit('product.viewed', {
          userId,
          productId: product.id,
          productName: product.name,
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`Product viewed event sent for user ${userId} viewing product ${product.id}`);
      } catch (kafkaError) {
        this.logger.error(`Failed to send product.viewed event: ${kafkaError.message}`, kafkaError.stack);
      }
    }

    return ProductMapper.toGetProductResponse(product);
  }

  async updateProduct(id: string, data: any): Promise<ProductProto.UpdateProductResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOneBy(Product, { id });
      if (!product) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          details: 'Product not found',
        });
      }

      Object.assign(product, {
        name: data.name || product.name,
        description: data.description || product.description,
        brandId: data.brandId || product.brandId,
        categoryId: data.categoryId || product.categoryId,
        originalPrice: data.originalPrice !== undefined ? data.originalPrice : product.originalPrice,
      });
      const savedProduct = await queryRunner.manager.save(product);

      if (data.skus && Array.isArray(data.skus)) {
        const existingSkus = await queryRunner.manager.findBy(Sku, { productId: id });
        const existingSkuCodes = new Set(existingSkus.map((s) => s.skuCode));
        const newSkuCodes = new Set(data.skus.map((s) => s.skuCode));

        const skusToDelete = existingSkus.filter((s) => !newSkuCodes.has(s.skuCode));
        if (skusToDelete.length) {
          await queryRunner.manager.remove(skusToDelete);
        }

        for (const skuData of data.skus) {
          let sku;
          if (existingSkuCodes.has(skuData.skuCode)) {
            sku = existingSkus.find((s) => s.skuCode === skuData.skuCode);
            Object.assign(sku, { price: skuData.price, stock: skuData.stock });
            await queryRunner.manager.save(sku);

            await queryRunner.manager.delete(SkuAttributeOption, { skuId: sku.id });
          } else {
            sku = queryRunner.manager.create(Sku, {
              productId: id,
              skuCode: skuData.skuCode,
              price: skuData.price,
              stock: skuData.stock,
            });
            await queryRunner.manager.save(sku);
          }

          if (skuData.attributes && Array.isArray(skuData.attributes)) {
            const skuOptions = skuData.attributes.map((a) =>
              queryRunner.manager.create(SkuAttributeOption, {
                skuId: sku.id,
                attributeOptionId: a.attributeOptionId,
              }),
            );
            await queryRunner.manager.save(skuOptions);
          }
        }
      }

      await queryRunner.commitTransaction();
      return ProductMapper.toUpdateResponse(savedProduct);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProduct(id: string): Promise<ProductProto.DeleteProductResponse> {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        details: 'Product not found',
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(SkuAttributeOption)
        .where('skuId IN (SELECT id FROM skus WHERE "productId" = :id)', { id })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Sku)
        .where('"productId" = :id', { id })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Product)
        .where('id = :id', { id })
        .execute();

      await queryRunner.commitTransaction();
      return { message: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async listProducts(
    page = 1,
    limit = 20,
    keyword?: string,
    brandId?: string,
    categoryId?: string,
    sortField?: ProductProto.SortField,
    sortOrder?: ProductProto.SortOrder,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<ProductProto.GetAllProductsResponse> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.skus', 'skus')
      .leftJoinAndSelect('skus.skuOptions', 'skuOptions')
      .leftJoinAndSelect('skuOptions.attributeOption', 'attributeOption')
      .leftJoinAndSelect('attributeOption.attribute', 'attribute');

    // Filters
    if (keyword) {
      queryBuilder.andWhere('product.name ILIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (brandId) {
      queryBuilder.andWhere('product.brandId = :brandId', { brandId });
    }
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Price range filtering (based on SKU prices)
    if (minPrice !== undefined || maxPrice !== undefined) {
      queryBuilder.andWhere((qb) => {
        const subQuery = qb.subQuery()
          .select('sku."productId"')
          .from(Sku, 'sku');

        if (minPrice !== undefined) {
          subQuery.andWhere('sku.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
          subQuery.andWhere('sku.price <= :maxPrice', { maxPrice });
        }

        return 'product.id IN ' + subQuery.getQuery();
      });
    }

    // Sorting
    const orderDirection = sortOrder === ProductProto.SortOrder.SORT_ORDER_DESC ? 'DESC' : 'ASC';

    switch (sortField) {
      case ProductProto.SortField.SORT_FIELD_NAME:
        queryBuilder.orderBy('product.name', orderDirection);
        break;
      case ProductProto.SortField.SORT_FIELD_PRICE:
        // Sort by minimum SKU price using raw SQL
        queryBuilder.orderBy(
          `(SELECT MIN(price) FROM skus WHERE skus."productId" = product.id)`,
          orderDirection
        );
        break;
      case ProductProto.SortField.SORT_FIELD_CREATED_AT:
        queryBuilder.orderBy('product.createdAt', orderDirection);
        break;
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
    }

    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products: ProductMapper.toListResponse(products),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }



  async getSkuDetail(skuId: string) {
    const relations = [
      'product',
      'product.brand',
      'product.category',
      'skuOptions',
      'skuOptions.attributeOption',
      'skuOptions.attributeOption.attribute',
    ];

    let sku = null;
    if (this.isValidUUID(skuId)) {
      sku = await this.skuRepo.findOne({
        where: { id: skuId },
        relations,
      });
    }

    if (!sku) {
      sku = await this.skuRepo.findOne({
        where: { skuCode: skuId },
        relations,
      });
    }

    if (!sku) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        details: `SKU not found: ${skuId}`,
      });
    }

    const product = sku.product ?? (await this.productRepo.findOne({ where: { id: sku.productId } }));

    if (!product) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        details: `Product not found for SKU: ${skuId}`,
      });
    }

    const attributes = (sku.skuOptions ?? [])
      .filter((option) => option.attributeOption)
      .map((option) => ({
        attributeOptionId: option.attributeOption.id,
        attributeOptionValue: option.attributeOption.value,
        attribute: option.attributeOption.attribute
          ? {
            id: option.attributeOption.attribute.id,
            name: option.attributeOption.attribute.name,
            description: option.attributeOption.attribute.description ?? null,
          }
          : undefined,
      }));

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        brandId: product.brandId,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      sku: {
        id: sku.id,
        skuCode: sku.skuCode,
        price: Number(sku.price),
        stock: sku.stock,
        attributes,
        createdAt: sku.createdAt,
        updatedAt: sku.updatedAt,
      },
    };
  }

  async existingSku(
    request: ProductProto.CheckSkuAvailabilityRequest,
  ): Promise<ProductProto.CheckSkuAvailabilityResponse> {
    const skuId = request.skuId?.trim();
    const requestedQuantity = request.quantity ?? 1;

    if (!skuId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        details: 'SKU ID is required',
      });
    }

    let sku = null;
    if (this.isValidUUID(skuId)) {
      sku = await this.skuRepo.findOne({
        where: { id: skuId },
        relations: [
          'product',
          'product.brand',
          'product.category',
          'skuOptions',
          'skuOptions.attributeOption',
          'skuOptions.attributeOption.attribute',
        ],
      });
    }

    if (!sku) {
      sku = await this.skuRepo.findOne({
        where: { skuCode: skuId },
        relations: [
          'product',
          'product.brand',
          'product.category',
          'skuOptions',
          'skuOptions.attributeOption',
          'skuOptions.attributeOption.attribute',
        ],
      });
    }

    if (!sku) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        details: `SKU not found: ${skuId}`,
      });
    }

    const product =
      sku.product ??
      (await this.productRepo.findOne({ where: { id: sku.productId } }));

    if (!product) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        details: `Product not found for SKU: ${skuId}`,
      });
    }

    const normalizedQuantity = requestedQuantity > 0 ? requestedQuantity : 1;
    const availableStock = sku.stock ?? 0;
    const inStock = availableStock >= normalizedQuantity;

    const skuOptions =
      sku.skuOptions?.map((option) => ({
        attributeOptionId: option.attributeOption?.id ?? '',
        attributeOptionValue: option.attributeOption?.value ?? '',
        attribute: option.attributeOption?.attribute
          ? {
            id: option.attributeOption.attribute.id,
            name: option.attributeOption.attribute.name,
            description: option.attributeOption.attribute.description ?? '',
          }
          : undefined,
      })) ?? [];

    return SkuMapper.toAvailabilityResponse(sku, product, requestedQuantity);
  }
  async validateSkuInputs(
    request: ProductProto.ValidateSkuInputRequest,
  ): Promise<ProductProto.ValidateSkuInputResponse> {
    if (!request.items || request.items.length === 0) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        details: 'No SKU items provided',
      });
    }

    const results: ProductProto.SkuValidationResult[] = [];

    for (const item of request.items) {
      const skuIdOrCode = item.skuId || item.skuCode;
      const quantity = item.quantity > 0 ? item.quantity : 1;

      if (!skuIdOrCode) {
        throw new RpcException({
          code: GrpcStatus.INVALID_ARGUMENT,
          details: 'Each item must have either skuId or skuCode',
        });
      }

      const relations = [
        'product',
        'product.brand',
        'product.category',
        'skuOptions',
        'skuOptions.attributeOption',
        'skuOptions.attributeOption.attribute',
      ];

      let sku = null;
      if (this.isValidUUID(skuIdOrCode)) {
        sku = await this.skuRepo.findOne({
          where: { id: skuIdOrCode },
          relations,
        });
      }

      if (!sku) {
        sku = await this.skuRepo.findOne({
          where: { skuCode: skuIdOrCode },
          relations,
        });
      }

      if (!sku) {
       throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          details: `SKU not found: ${skuIdOrCode}`,
        });
      }

      const product =
        sku.product ?? (await this.productRepo.findOne({ where: { id: sku.productId } }));

      if (!product) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          details: `Product not found for SKU: ${skuIdOrCode}`,
        });
      }

      const availableStock = sku.stock ?? 0;
      const inStock = availableStock >= quantity;

      const skuOptions =
        sku.skuOptions?.map((option) => ({
          attributeOptionId: option.attributeOption?.id ?? '',
          attributeOptionValue: option.attributeOption?.value ?? '',
          attribute: option.attributeOption?.attribute
            ? {
              id: option.attributeOption.attribute.id,
              name: option.attributeOption.attribute.name,
              description: option.attributeOption.attribute.description ?? '',
            }
            : undefined,
        })) ?? [];

      results.push({
        productId: product.id,
        name: product.name,
        description: product.description ?? '',
        brand: product.brand ? {
          id: product.brand.id,
          name: product.brand.name,
        } : undefined,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        } : undefined,
        skuId: sku.id,
        skuCode: sku.skuCode,
        price: Number(sku.price),
        stock: sku.stock,
        image: sku.image ?? '',
        skuOptions,
        valid: inStock,
        inStock,
        availableStock,
        message: inStock
          ? 'SKU is valid and in stock'
          : 'Not enough stock for this SKU',
      });
    }

    const allValid = results.every((r) => r.valid);

    return {
      allValid,
      results,
    };
  }
  async getAttribute(): Promise<ProductProto.GetAttributesResponse> {
    console.log('Fetching all attributes...');
    const attribute = await this.attributeRepo.find()
    return {
      attributes: attribute.map(attr => ({
        id: attr.id,
        name: attr.name,
        description: attr.description || '',
      }))
    }
  }

  async getAttributeOptions(attributeId: string): Promise<ProductProto.GetAttributeOptionsResponse> {
  const attribute = await this.attributeRepo.findOneBy({ id: attributeId });
  if (!attribute) {
    throw new RpcException({
      code: GrpcStatus.NOT_FOUND,
      details: 'Attribute not found',
    });
  }

  const options = await this.attributeOptionRepo.findBy({ attributeId });
  return {
    attributeId: attribute.id,
    attributeName: attribute.name,
    options: options.map(opt => ({
      id: opt.id,
      value: opt.value,
      description: '',
    })),
  };
}
}