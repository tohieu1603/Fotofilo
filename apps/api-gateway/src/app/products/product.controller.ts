import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { GrpcClientExceptionFilter } from '../common/filters/grpc-exception.filter';
import { Product } from '@nestcm/proto';

import {
  CreateProductDto,
  GetProductsQueryDto,
  UpdateProductDto,
  CreateProductResponseDto,
  GetProductsResponseDto,
  GetProductResponseDto
} from './dto';

import { ProductMapperService } from './mappers';
import { CreateProductResponse } from 'libs/proto/src/generated/product';
import { OptionalJwtAuthGuard } from '../auth/guards';
import { OptionalUser } from '../auth/decorators';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('products')
@UseFilters(new GrpcClientExceptionFilter())
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly mapper: ProductMapperService
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: CreateProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async createProduct(@Body() body: CreateProductDto): Promise<CreateProductResponseDto> {
    const req = this.mapper.fromDtoToProto(body);
    const response = await this.productService.createProduct(req);

    return {
      product: this.mapper.fromProtoToDto(response.product),
    }
  }



  @Get()
  @ApiOperation({ summary: 'Get products (pagination + filters)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'keyword', required: false, type: String, example: 'shirt' })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'price:asc' })
  @ApiResponse({ status: 200, description: 'Products list', type: GetProductsResponseDto })
  async getProducts(@Query() query: GetProductsQueryDto): Promise<GetProductsResponseDto> {
    const req: Product.GetAllProductsRequest = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      keyword: query.keyword || '',
      brandId: query.brandId || '',
      categoryId: query.categoryId || '',
      sort: query.sort || 'name:asc',
    };

    const response = await this.productService.getProducts(req);
    const items = (response.products || []).map(p => this.mapper.fromProtoToDto(p));

    return {
      items,
      total: response.total || items.length,
      page: response.page || req.page,
      limit: response.limit || req.limit,
    };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get single product by id (optional auth)' })
  @ApiParam({ name: 'id', required: true, description: 'Product id' })
  @ApiResponse({ status: 200, description: 'Product detail', type: GetProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Param('id') id: string,
    @OptionalUser('userId') userId?: string
  ): Promise<GetProductResponseDto> {
    const req: Product.GetProductRequest = {
      id,
      userId: userId || undefined,
    };
    const response = await this.productService.getProduct(req);

    return {
      product: this.mapper.fromProtoToDto(response),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Updated product', type: GetProductResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto): Promise<GetProductResponseDto> {
    const req = { id, ...body } as Product.UpdateProductRequest;
    const response = await this.productService.updateProduct(req);

    return {
      product: this.mapper.fromProtoToDto(response.product),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Deleted', type: GetProductResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deleteProduct(@Param('id') id: string): Promise<GetProductResponseDto> {
    const req: Product.DeleteProductRequest = {
      id,
    };
    await this.productService.deleteProduct(req);

    return {
      product: this.mapper.createEmptyDto(id, 'Deleted')
    };
  }
}