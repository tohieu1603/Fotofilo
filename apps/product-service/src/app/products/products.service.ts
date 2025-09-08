import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { Sku } from './entities/sku.entity';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { AttributeOption } from './entities/attribute-option.entity';
import { SkuAttributeOption } from './entities/sku-attribute-option.entity';
import {
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductResponse,
  GetAllProductsResponse,
  GetProductResponse,
} from '@nestcm/proto';
import { ProductMapper } from './mappers/product.mapper';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Sku) private skuRepo: Repository<Sku>,
    @InjectRepository(Brand) private brandRepo: Repository<Brand>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(AttributeOption) private attributeOptionRepo: Repository<AttributeOption>,
    @InjectRepository(SkuAttributeOption) private skuAttrOptionRepo: Repository<SkuAttributeOption>,
    private readonly dataSource: DataSource,
    // private readonly kafkaService: KafkaService,
    // private readonly redis: RedisService,
  ) {}

  async createProductWithSkus(data: CreateProductRequest): Promise<CreateProductResponse> {
    console.log(data) 
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [brand, category] = await Promise.all([
        queryRunner.manager.findOneBy(Brand, { id: data.brandId }),
        queryRunner.manager.findOneBy(Category, { id: data.categoryId }),
      ]);
      if (!brand) throw new NotFoundException('Brand not found');
      if (!category) throw new NotFoundException('Category not found');

      const allAttrOptionIds = data.skus.flatMap((sku) =>
        sku.attributes.map((a) => a.attributeOptionId),
      );
      const attrOptions = await queryRunner.manager.findBy(AttributeOption, {
        id: In(allAttrOptionIds),
      });
      const foundIds = new Set(attrOptions.map((o) => o.id));
      const missingIds = allAttrOptionIds.filter((id) => !foundIds.has(id));
      if (missingIds.length)
        throw new BadRequestException(
          `Missing attribute options: ${missingIds.join(', ')}`,
        );

      const product = queryRunner.manager.create(Product, {
        name: data.name,
        description: data.description,
        brandId: data.brandId,
        categoryId: data.categoryId,
      });
      const savedProduct = await queryRunner.manager.save(product);

      for (const skuData of data.skus) {
        const sku = queryRunner.manager.create(Sku, {
          productId: savedProduct.id,
          skuCode: skuData.skuCode,
          price: skuData.price,
          stock: skuData.stock,
        });
        const savedSku = await queryRunner.manager.save(sku);

        const skuOptions = skuData.attributes.map((a) =>
          queryRunner.manager.create(SkuAttributeOption, {
            skuId: savedSku.id,
            attributeOptionId: a.attributeOptionId,
          }),
        );
        await queryRunner.manager.save(skuOptions);
      }

      // await this.kafkaService.emit('product.created', savedProduct);
      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getProduct(id: string): Promise<GetProductResponse> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['skus.skuOptions.attributeOption.attribute'],
    });

    if (!product) throw new NotFoundException('Product not found');

    return ProductMapper.toResponse(product);
  }

  async updateProduct(id: string, data: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOneBy(Product, { id });
      if (!product) throw new NotFoundException('Product not found');

      Object.assign(product, {
        name: data.name,
        description: data.description,
        brandId: data.brandId,
        categoryId: data.categoryId,
      });
      const savedProduct = await queryRunner.manager.save(product);

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

        const skuOptions = skuData.attributes.map((a) =>
          queryRunner.manager.create(SkuAttributeOption, {
            skuId: sku.id,
            attributeOptionId: a.attributeOptionId,
          }),
        );
        await queryRunner.manager.save(skuOptions);
      }

      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProduct(id: string): Promise<DeleteProductResponse> {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(SkuAttributeOption)
        .where('skuId IN (SELECT id FROM skus WHERE productId = :id)', { id })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Sku)
        .where('productId = :id', { id })
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
  ): Promise<GetAllProductsResponse> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (keyword) {
      where.name = ILike(`%${keyword}%`);
    }
    if (brandId) {
      where.brandId = brandId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await this.productRepo.findAndCount({
      skip,
      take: limit,
      relations: ['skus.skuOptions.attributeOption.attribute'],
      where,
    });
    return { 
      products: ProductMapper.toResponses(products), 
      total, 
      page, 
      limit, 
      totalPages: Math.ceil(total / limit) 
    };
  }
}
